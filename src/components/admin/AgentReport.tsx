import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { Booking } from "@/types/booking";

interface Props {
  bookings: Booking[];
}

interface AgentSummary {
  agentName: string;
  agentPhone: string;
  agentCompany: string;
  bookings: Booking[];
  totalQuads: number;
  totalGuests: number;
  totalPrepayment: number;
  bookingsCount: number;
}

function displayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function buildSummaries(bookings: Booking[]): AgentSummary[] {
  const map = new Map<string, AgentSummary>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const key = b.agentPhone || b.agentName;
    if (!map.has(key)) {
      map.set(key, {
        agentName: b.agentName,
        agentPhone: b.agentPhone,
        agentCompany: b.agentCompany,
        bookings: [],
        totalQuads: 0,
        totalGuests: 0,
        totalPrepayment: 0,
        bookingsCount: 0,
      });
    }
    const s = map.get(key)!;
    s.bookings.push(b);
    s.totalQuads += b.quadsCount;
    s.totalGuests += b.quadsCount * 2;
    s.totalPrepayment += b.prepayment ?? 0;
    s.bookingsCount += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.bookingsCount - a.bookingsCount);
}

function exportCSV(agent: AgentSummary) {
  const header = "Дата;Время;Гость;Телефон гостя;Адрес;Квадры;Гостей;Предоплата;Статус";
  const rows = agent.bookings.map(b => [
    displayDate(b.date),
    b.slotTime,
    b.guestName,
    b.guestPhone,
    b.guestAddress,
    b.quadsCount,
    b.quadsCount * 2,
    b.prepayment ?? 0,
    b.status === "active" ? "Активна" : b.status === "transferred" ? "Перенесена" : "Отменена",
  ].join(";"));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `сверка_${agent.agentName.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printAgent(agent: AgentSummary) {
  const rows = agent.bookings.map(b => `
    <tr>
      <td>${displayDate(b.date)}</td>
      <td>${b.slotTime}</td>
      <td>${b.guestName}</td>
      <td>${b.guestPhone}</td>
      <td>${b.guestAddress}</td>
      <td>${b.quadsCount}</td>
      <td>${b.quadsCount * 2}</td>
      <td>${b.prepayment ? b.prepayment + " ₽" : "—"}</td>
    </tr>`).join("");

  const html = `
    <html><head><meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h2 { margin-bottom: 4px; }
      p { color: #666; margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: #f0f0f0; padding: 6px 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
      td { padding: 5px 8px; border: 1px solid #ddd; }
      tr:nth-child(even) { background: #fafafa; }
      .totals { margin-top: 12px; font-weight: bold; }
    </style></head><body>
    <h2>Сверка: ${agent.agentName}</h2>
    <p>Телефон: ${agent.agentPhone}</p>
    <p>Компания: ${agent.agentCompany}</p>
    <table>
      <thead><tr>
        <th>Дата</th><th>Время</th><th>Гость</th><th>Телефон</th>
        <th>Адрес</th><th>Квадры</th><th>Гостей</th><th>Предоплата</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      Итого: ${agent.bookingsCount} броней · ${agent.totalQuads} квадроциклов · 
      ${agent.totalGuests} гостей · предоплата ${agent.totalPrepayment} ₽
    </div>
    </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.print();
}

export default function AgentReport({ bookings }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const allSummaries = useMemo(() => buildSummaries(bookings), [bookings]);

  const filteredSummaries = useMemo(() => {
    return allSummaries.filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.agentName.toLowerCase().includes(q) ||
        s.agentCompany.toLowerCase().includes(q) ||
        s.agentPhone.includes(q);
    });
  }, [allSummaries, search]);

  // Если агент выбран — фильтруем его брони по диапазону дат
  const agentBookings = useMemo(() => {
    if (!selectedAgent) return [];
    return selectedAgent.bookings.filter(b => {
      if (dateFrom && b.date < dateFrom) return false;
      if (dateTo && b.date > dateTo) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.slotTime.localeCompare(b.slotTime));
  }, [selectedAgent, dateFrom, dateTo]);

  const agentStats = useMemo(() => ({
    count: agentBookings.length,
    quads: agentBookings.reduce((s, b) => s + b.quadsCount, 0),
    guests: agentBookings.reduce((s, b) => s + b.quadsCount * 2, 0),
    prepayment: agentBookings.reduce((s, b) => s + (b.prepayment ?? 0), 0),
  }), [agentBookings]);

  // Глобальная статистика
  const globalStats = useMemo(() => {
    const active = bookings.filter(b => b.status !== "cancelled");
    return {
      agents: allSummaries.length,
      bookings: active.length,
      quads: active.reduce((s, b) => s + b.quadsCount, 0),
      prepayment: active.reduce((s, b) => s + (b.prepayment ?? 0), 0),
    };
  }, [bookings, allSummaries]);

  const statCls = "bg-surface border border-border rounded-sm p-4 text-center";

  if (selectedAgent) {
    // Детальный вид агента
    const filteredAgent: AgentSummary = { ...selectedAgent, bookings: agentBookings,
      totalQuads: agentStats.quads, totalGuests: agentStats.guests,
      totalPrepayment: agentStats.prepayment, bookingsCount: agentStats.count };

    return (
      <div>
        {/* Back */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setSelectedAgent(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-fire transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />
            Все агенты
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-display font-bold">{selectedAgent.agentName}</span>
        </div>

        {/* Agent header */}
        <div className="bg-surface/40 border border-border rounded-sm p-5 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-display text-xl font-bold mb-1">{selectedAgent.agentName}</h3>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <a href={`tel:${selectedAgent.agentPhone}`} className="flex items-center gap-1.5 text-green-400 hover:text-green-300">
                  <Icon name="Phone" size={13} />{selectedAgent.agentPhone}
                </a>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="Briefcase" size={13} />{selectedAgent.agentCompany}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportCSV(filteredAgent)}
                className="flex items-center gap-1.5 border border-border hover:border-fire/50 hover:text-fire px-3 py-2 text-xs font-display tracking-wider rounded-sm transition-all"
              >
                <Icon name="Download" size={12} />
                CSV
              </button>
              <button
                onClick={() => printAgent(filteredAgent)}
                className="flex items-center gap-1.5 border border-border hover:border-fire/50 hover:text-fire px-3 py-2 text-xs font-display tracking-wider rounded-sm transition-all"
              >
                <Icon name="Printer" size={12} />
                ПЕЧАТЬ
              </button>
            </div>
          </div>
        </div>

        {/* Date filter */}
        <div className="flex gap-2 items-center mb-5">
          <span className="text-xs text-muted-foreground font-display tracking-wider">ПЕРИОД:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-1.5 text-sm outline-none" />
          <span className="text-muted-foreground">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-1.5 text-sm outline-none" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs text-muted-foreground hover:text-fire transition-colors">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        {/* Итоговые цифры */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Броней", value: agentStats.count, color: "text-fire" },
            { label: "Квадроциклов", value: agentStats.quads, color: "text-foreground" },
            { label: "Гостей (макс.)", value: agentStats.guests, color: "text-foreground" },
            { label: "Предоплата", value: `${agentStats.prepayment.toLocaleString()} ₽`, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className={statCls}>
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Таблица броней */}
        {agentBookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="FileX" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-display tracking-wider text-sm">НЕТ ДАННЫХ ЗА ПЕРИОД</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {["Дата","Время","Гость","Телефон","Адрес трансфера","Квадры","Гостей","Предоплата","Статус"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-display text-xs tracking-wider text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentBookings.map((b, i) => (
                  <tr key={b.id} className={`border-b border-border/50 transition-colors hover:bg-fire/5 ${
                    i % 2 === 0 ? "" : "bg-surface/30"
                  } ${b.status !== "active" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-display font-bold whitespace-nowrap">{displayDate(b.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-fire/15 text-fire px-2 py-0.5 rounded-sm text-xs font-display">{b.slotTime}</span>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{b.guestName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={`tel:${b.guestPhone}`} className="text-green-400 hover:text-green-300 text-xs">{b.guestPhone}</a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-48 truncate" title={b.guestAddress}>{b.guestAddress}</td>
                    <td className="px-4 py-3 text-center font-bold text-fire">{b.quadsCount}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{b.quadsCount * 2}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.prepayment
                        ? <span className="text-green-400 font-semibold">{b.prepayment.toLocaleString()} ₽</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-display px-2 py-0.5 rounded-sm border ${
                        b.status === "active" ? "text-green-400 bg-green-900/20 border-green-700/30"
                        : b.status === "transferred" ? "text-gold bg-gold/10 border-gold/30"
                        : "text-red-400 bg-red-900/20 border-red-700/30"
                      }`}>
                        {b.status === "active" ? "АКТИВНА" : b.status === "transferred" ? "ПЕРЕНЕСЕНА" : "ОТМЕНЕНА"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface font-bold">
                  <td colSpan={5} className="px-4 py-3 font-display text-xs tracking-wider text-muted-foreground">ИТОГО</td>
                  <td className="px-4 py-3 text-center text-fire">{agentStats.quads}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{agentStats.guests}</td>
                  <td className="px-4 py-3 text-green-400">{agentStats.prepayment.toLocaleString()} ₽</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{agentStats.count} броней</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Общий список агентов
  return (
    <div>
      {/* Общие цифры */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Агентов", value: globalStats.agents, icon: "Users", color: "text-fire" },
          { label: "Броней всего", value: globalStats.bookings, icon: "BookCheck", color: "text-foreground" },
          { label: "Квадроциклов", value: globalStats.quads, icon: "Bike", color: "text-foreground" },
          { label: "Сумма предоплат", value: `${globalStats.prepayment.toLocaleString()} ₽`, icon: "Banknote", color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className={statCls}>
            <Icon name={s.icon} size={16} className={`${s.color} mx-auto mb-1.5`} />
            <div className={`font-display text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по агенту, компании, телефону..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {/* Таблица агентов */}
      {filteredSummaries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Users" size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-display tracking-wider text-sm">АГЕНТОВ НЕТ</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {["Агент","Компания","Телефон","Броней","Квадры","Гостей (макс.)","Предоплата",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-display text-xs tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map((s, i) => (
                <tr
                  key={s.agentPhone + s.agentName}
                  className={`border-b border-border/50 hover:bg-fire/5 transition-colors cursor-pointer group ${
                    i % 2 === 0 ? "" : "bg-surface/30"
                  }`}
                  onClick={() => setSelectedAgent(s)}
                >
                  <td className="px-4 py-3 font-semibold whitespace-nowrap group-hover:text-fire transition-colors">
                    {s.agentName || <span className="text-muted-foreground/40 italic">Не указан</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.agentCompany || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`tel:${s.agentPhone}`} onClick={e => e.stopPropagation()}
                      className="text-green-400 hover:text-green-300 text-xs">{s.agentPhone || "—"}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-display font-bold text-fire">{s.bookingsCount}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.totalQuads}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.totalGuests}</td>
                  <td className="px-4 py-3">
                    {s.totalPrepayment > 0
                      ? <span className="text-green-400 font-semibold">{s.totalPrepayment.toLocaleString()} ₽</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-fire font-display tracking-wider whitespace-nowrap">
                      <Icon name="ChevronRight" size={14} />
                      СВЕРКА
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
