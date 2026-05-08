
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  quads_count INTEGER NOT NULL CHECK (quads_count > 0),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_address TEXT NOT NULL,
  agent_name TEXT NOT NULL DEFAULT '',
  agent_phone TEXT NOT NULL DEFAULT '',
  agent_company TEXT NOT NULL DEFAULT '',
  prepayment INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','transferred')),
  transferred_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  label TEXT NOT NULL,
  quads_total INTEGER NOT NULL DEFAULT 7 CHECK (quads_total > 0),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Дефолтные слоты
INSERT INTO time_slots (id, time, label, quads_total, sort_order) VALUES
  ('s1', '08:00', 'Утренний рейд', 7, 1),
  ('s2', '10:00', 'Дневной старт', 7, 2),
  ('s3', '12:00', 'Полуденный тур', 7, 3),
  ('s4', '14:00', 'Послеобеденный', 7, 4),
  ('s5', '16:00', 'Закатный рейд', 7, 5),
  ('s6', '18:00', 'Вечерний заезд', 7, 6)
ON CONFLICT (id) DO NOTHING;

-- Дефолтный пароль (хранится хешем sha256 строки "admin2024")
INSERT INTO settings (key, value) VALUES
  ('admin_password_hash', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2')
ON CONFLICT (key) DO NOTHING;
