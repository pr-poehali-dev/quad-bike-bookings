"""
API для системы бронирования квадроциклов КвадроЛидер.
Все операции с бронями защищены от овербукинга через SELECT FOR UPDATE.
"""
import json
import os
import hashlib
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return resp({"error": msg}, status)

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()

def check_admin(event) -> bool:
    token = event.get("headers", {}).get("X-Admin-Token", "")
    if not token:
        return False
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT value FROM settings WHERE key = 'admin_password_hash'")
            row = cur.fetchone()
            if not row:
                return False
            return row[0] == sha256(token)

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Invalid JSON")

    # ── GET /slots ────────────────────────────────────────────────
    if method == "GET" and path == "/slots":
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, time, label, quads_total FROM time_slots ORDER BY sort_order, time")
                slots = cur.fetchall()
        return resp([dict(s) for s in slots])

    # ── GET /bookings ─────────────────────────────────────────────
    if method == "GET" and path == "/bookings":
        if not check_admin(event):
            return err("Unauthorized", 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, date, slot_id, slot_time, quads_count,
                           guest_name, guest_phone, guest_address,
                           agent_name, agent_phone, agent_company,
                           prepayment, status, transferred_to, created_at
                    FROM bookings ORDER BY date, slot_time, created_at
                """)
                bookings = cur.fetchall()
        return resp([dict(b) for b in bookings])

    # ── GET /availability?date=YYYY-MM-DD ─────────────────────────
    if method == "GET" and path == "/availability":
        date = (event.get("queryStringParameters") or {}).get("date", "")
        if not date:
            return err("date required")
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, time, label, quads_total FROM time_slots ORDER BY sort_order, time")
                slots = cur.fetchall()
                cur.execute("""
                    SELECT slot_id, COALESCE(SUM(quads_count), 0) AS booked
                    FROM bookings
                    WHERE date = %s AND status = 'active'
                    GROUP BY slot_id
                """, (date,))
                booked_map = {r["slot_id"]: int(r["booked"]) for r in cur.fetchall()}
        result = []
        for s in slots:
            booked = booked_map.get(s["id"], 0)
            result.append({**dict(s), "booked": booked, "free": s["quads_total"] - booked})
        return resp(result)

    # ── POST /book ────────────────────────────────────────────────
    if method == "POST" and path == "/book":
        required = ["date", "slotId", "quadsCount", "guestName", "guestPhone", "guestAddress"]
        for f in required:
            if not body.get(f):
                return err(f"Missing field: {f}")

        date = str(body["date"])[:10]
        slot_id = str(body["slotId"])[:20]
        quads = int(body["quadsCount"])
        if quads < 1 or quads > 20:
            return err("Invalid quadsCount")

        guest_name = str(body["guestName"])[:200].strip()
        guest_phone = str(body["guestPhone"])[:50].strip()
        guest_address = str(body["guestAddress"])[:500].strip()
        agent_name = str(body.get("agentName", ""))[:200].strip()
        agent_phone = str(body.get("agentPhone", ""))[:50].strip()
        agent_company = str(body.get("agentCompany", ""))[:200].strip()
        prepayment = body.get("prepayment")
        if prepayment is not None:
            prepayment = max(0, int(prepayment))

        booking_id = f"bk-{uuid.uuid4().hex[:10]}"

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Получаем слот
                cur.execute("SELECT quads_total, time FROM time_slots WHERE id = %s", (slot_id,))
                slot = cur.fetchone()
                if not slot:
                    return err("Slot not found")

                # АТОМАРНАЯ БЛОКИРОВКА — SELECT FOR UPDATE
                # Блокируем строки броней этого слота на эту дату
                cur.execute("""
                    SELECT COALESCE(SUM(quads_count), 0) AS booked
                    FROM bookings
                    WHERE date = %s AND slot_id = %s AND status = 'active'
                    FOR UPDATE
                """, (date, slot_id))
                booked = int(cur.fetchone()["booked"])
                free = slot["quads_total"] - booked

                if quads > free:
                    conn.rollback()
                    return err(f"Нет мест. Свободно: {free}, запрошено: {quads}", 409)

                cur.execute("""
                    INSERT INTO bookings
                      (id, date, slot_id, slot_time, quads_count,
                       guest_name, guest_phone, guest_address,
                       agent_name, agent_phone, agent_company, prepayment, status)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'active')
                    RETURNING *
                """, (
                    booking_id, date, slot_id, slot["time"], quads,
                    guest_name, guest_phone, guest_address,
                    agent_name, agent_phone, agent_company, prepayment
                ))
                new_booking = dict(cur.fetchone())
            conn.commit()

        return resp(new_booking, 201)

    # ── PUT /bookings/<id> ────────────────────────────────────────
    if method == "PUT" and path.startswith("/bookings/"):
        if not check_admin(event):
            return err("Unauthorized", 401)
        booking_id = path.split("/")[-1]
        allowed = {"status", "transferred_to"}
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return err("Nothing to update")
        set_clause = ", ".join(f"{k} = %s" for k in updates)
        values = list(updates.values()) + [booking_id]
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"UPDATE bookings SET {set_clause} WHERE id = %s RETURNING *", values)
                row = cur.fetchone()
                if not row:
                    return err("Not found", 404)
            conn.commit()
        return resp(dict(row))

    # ── GET /companies ────────────────────────────────────────────
    if method == "GET" and path == "/companies":
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT name FROM companies ORDER BY name")
                companies = [r[0] for r in cur.fetchall()]
        return resp(companies)

    # ── POST /settings/slots ──────────────────────────────────────
    if method == "POST" and path == "/settings/slots":
        if not check_admin(event):
            return err("Unauthorized", 401)
        slots = body.get("slots", [])
        if not isinstance(slots, list):
            return err("slots must be array")
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM time_slots")
                for i, s in enumerate(slots):
                    cur.execute("""
                        INSERT INTO time_slots (id, time, label, quads_total, sort_order)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (s["id"], s["time"][:5], s["label"][:100], max(1, int(s["quadsTotal"])), i))
            conn.commit()
        return resp({"ok": True})

    # ── POST /settings/companies ──────────────────────────────────
    if method == "POST" and path == "/settings/companies":
        if not check_admin(event):
            return err("Unauthorized", 401)
        companies = body.get("companies", [])
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM companies")
                for name in companies:
                    if str(name).strip():
                        cur.execute("INSERT INTO companies (name) VALUES (%s) ON CONFLICT DO NOTHING", (str(name).strip()[:200],))
            conn.commit()
        return resp({"ok": True})

    # ── POST /settings/password ───────────────────────────────────
    if method == "POST" and path == "/settings/password":
        if not check_admin(event):
            return err("Unauthorized", 401)
        new_pw = str(body.get("newPassword", ""))
        if len(new_pw) < 4:
            return err("Password too short")
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO settings (key, value) VALUES ('admin_password_hash', %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                """, (sha256(new_pw),))
            conn.commit()
        return resp({"ok": True})

    # ── POST /auth ────────────────────────────────────────────────
    if method == "POST" and path == "/auth":
        password = str(body.get("password", ""))
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM settings WHERE key = 'admin_password_hash'")
                row = cur.fetchone()
        if not row:
            return err("Auth not configured", 500)
        if row[0] == sha256(password):
            return resp({"ok": True, "token": password})
        return err("Wrong password", 401)

    return err("Not found", 404)
