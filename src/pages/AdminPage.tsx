import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Booking } from "@/types/booking";
import { getBookings, updateBooking, getAdminPassword, getTimeSlots, getSlotsWithAvailability, isDayFull, getDayFreeTotal } from "@/lib/bookingStore";
import SettingsPanel from "@/components/admin/SettingsPanel";
import QuickBooking from "@/components/admin/QuickBooking";
import AgentReport from "@/components/admin/AgentReport";

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_OF_WEEK = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function displayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

// Login screen
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === getAdminPassword()) { onLogin(); }
    else { setError(true); setPw(""); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div className="min-h-screen bg-background diagonal-lines flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-fire/15 border border-fire/30 rounded-sm flex items-center justify-center mx-auto mb-4">
            <Icon name="Shield" size={28} className="text-fire" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider">ADMIN</h1>
          <p className="text-muted-foreground text-sm mt-1">Панель управления записями</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground block mb-2">ПАРОЛЬ</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Введите пароль"
              autoFocus
              className={`w-full bg-surface border rounded-sm px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 ${
                error ? "border-red-500 animate-pulse" : "border-border focus:border-fire/60"
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1.5 font-display tracking-wider">НЕВЕРНЫЙ ПАРОЛЬ</p>}
          </div>
          <button type="submit" className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-3.5 text-sm transition-all">
            ВОЙТИ →
          </button>
        </form>
      </div>
    </div>
  );
}

// Transfer list modal
function TransferList({ date, bookings, onClose }: { date: string; bookings: Booking[]; onClose: () => void }) {
  const active = bookings.filter(b => b.date === date && b.status === "active");
  const bySlot = getTimeSlots().map(slot => ({
    slot,
    bookings: active.filter(b => b.slotId === slot.id),
  })).filter(g => g.bookings.length > 0);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-background border border-border rounded-sm my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wider">СПИСОК ДЛЯ ВОДИТЕЛЯ</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Трансфер на {displayDate(date)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 border border-border hover:border-fire/50 px-3 py-1.5 text-xs font-display tracking-wider rounded-sm transition-all">
              <Icon name="Printer" size={12} />
              ПЕЧАТЬ
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-white/10 transition-colors">
              <Icon name="X" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {bySlot.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Нет записей на эту дату</p>
          )}
          {bySlot.map(({ slot, bookings: sBookings }) => (
            <div key={slot.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-fire text-white font-display font-bold px-3 py-1 text-sm rounded-sm">{slot.time}</div>
                <span className="text-sm text-muted-foreground">{slot.label}</span>
              </div>
              <div className="space-y-2">
                {sBookings.map(b => (
                  <div key={b.id} className="bg-surface border border-border rounded-sm p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{b.guestName}</span>
                          <span className="text-xs bg-fire/15 text-fire px-2 py-0.5 rounded-sm font-display">{b.quadsCount} кв.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Icon name="MapPin" size={12} />
                          <span>{b.guestAddress}</span>
                        </div>
                        <a href={`tel:${b.guestPhone}`} className="flex items-center gap-1.5 text-sm text-fire hover:text-fire/75">
                          <Icon name="Phone" size={12} />
                          {b.guestPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Transfer panel — выбор даты → слота с остатками
function TransferPanel({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: Booking;
  onConfirm: (date: string, slotId: string, slotTime: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"date" | "slot">("date");
  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState<ReturnType<typeof getSlotsWithAvailability>>([]);

  const handleDateNext = () => {
    if (!newDate) return;
    setSlots(getSlotsWithAvailability(newDate, booking.id));
    setStep("slot");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mt-3 border border-border rounded-sm p-4 bg-background space-y-3 animate-fade-in">
      {step === "date" ? (
        <>
          <p className="text-xs font-display tracking-wider text-muted-foreground">ВЫБЕРИТЕ НОВУЮ ДАТУ</p>
          <div className="flex gap-2">
            <input
              type="date"
              min={today}
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={handleDateNext}
              disabled={!newDate}
              className="bg-fire text-white font-display text-xs tracking-wider px-4 py-2 rounded-sm hover:bg-fire/85 disabled:opacity-40 transition-all"
            >
              ДАЛЕЕ →
            </button>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-white/10 transition-colors">
              <Icon name="X" size={14} className="text-muted-foreground" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setStep("date")} className="text-xs text-muted-foreground hover:text-fire transition-colors flex items-center gap-1">
              <Icon name="ChevronLeft" size={12} />
              {newDate}
            </button>
            <span className="text-xs text-muted-foreground">→ выберите слот</span>
          </div>
          <div className="space-y-1.5">
            {slots.map(slot => {
              const isFull = slot.free === 0;
              const noFit = slot.free < booking.quadsCount;

              let statusColor = "text-fire";
              let statusBg = "bg-fire/10 border-fire/30";
              if (slot.free <= 2 && slot.free > 0) { statusColor = "text-gold"; statusBg = "bg-gold/10 border-gold/30"; }
              if (isFull || noFit) { statusColor = "text-red-500"; statusBg = "bg-red-50 border-red-200"; }

              return (
                <button
                  key={slot.id}
                  disabled={isFull || noFit}
                  onClick={() => onConfirm(newDate, slot.id, slot.time)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm border transition-all text-left ${
                    isFull || noFit
                      ? "opacity-40 cursor-not-allowed bg-surface border-border"
                      : "bg-surface border-border hover:border-fire/50 hover:bg-fire/5 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-base w-12">{slot.time}</span>
                    <span className="text-xs text-muted-foreground">{slot.label}</span>
                  </div>
                  <div className={`text-xs font-display tracking-wider px-2 py-1 rounded-sm border ${statusBg} ${statusColor}`}>
                    {isFull ? "ЗАНЯТО" : noFit ? `только ${slot.free} кв.` : `${slot.free}/${slot.quadsTotal} св.`}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Booking card in admin
function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const [showTransfer, setShowTransfer] = useState(false);

  const cancel = () => {
    if (confirm("Отменить запись?")) { updateBooking(booking.id, { status: "cancelled" }); onUpdate(); }
  };
  const confirmTransfer = (newDate: string, slotId: string, slotTime: string) => {
    updateBooking(booking.id, {
      status: "transferred",
      transferredTo: newDate,
      date: newDate,
      slotId,
      slotTime,
    });
    onUpdate();
    setShowTransfer(false);
  };

  const statusColors: Record<string, string> = {
    active: "text-fire bg-fire/10 border-fire/30",
    cancelled: "text-red-500 bg-red-50 border-red-200",
    transferred: "text-gold bg-gold/10 border-gold/30",
  };
  const statusLabels: Record<string, string> = {
    active: "АКТИВНА", cancelled: "ОТМЕНЕНА", transferred: "ПЕРЕНЕСЕНА",
  };

  return (
    <div className={`bg-surface border rounded-sm p-5 transition-all ${booking.status !== "active" ? "opacity-60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display font-bold text-lg">{booking.guestName}</span>
            <span className={`text-xs font-display tracking-wider px-2 py-0.5 rounded-sm border ${statusColors[booking.status]}`}>
              {statusLabels[booking.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Icon name="Calendar" size={11} />{displayDate(booking.date)}</span>
            <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{booking.slotTime}</span>
            <span className="flex items-center gap-1 text-fire"><Icon name="Bike" size={11} />{booking.quadsCount} квадр.</span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground font-display">
          {booking.prepayment
            ? <span className="text-fire font-bold">{booking.prepayment}₽</span>
            : <span>Без предоплаты</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-1.5">
          <p className="font-display text-xs tracking-wider text-fire mb-2">ГОСТЬ</p>
          <p className="text-foreground">{booking.guestName}</p>
          <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-1.5 text-fire hover:text-fire/75 transition-colors">
            <Icon name="Phone" size={13} />{booking.guestPhone}
          </a>
          <p className="flex items-start gap-1.5 text-muted-foreground text-xs">
            <Icon name="MapPin" size={11} className="mt-0.5 flex-shrink-0" />{booking.guestAddress}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="font-display text-xs tracking-wider text-gold mb-2">АГЕНТ</p>
          <p className="text-foreground">{booking.agentName}</p>
          <a href={`tel:${booking.agentPhone}`} className="flex items-center gap-1.5 text-fire hover:text-fire/75 transition-colors">
            <Icon name="Phone" size={13} />{booking.agentPhone}
          </a>
          <p className="text-xs text-muted-foreground">{booking.agentCompany}</p>
        </div>
      </div>

      {booking.transferredTo && (
        <div className="flex items-center gap-1.5 text-xs text-gold mb-3">
          <Icon name="ArrowRight" size={12} />
          Перенесено на {displayDate(booking.transferredTo)}
        </div>
      )}

      {booking.status === "active" && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <a
            href={`tel:${booking.guestPhone}`}
            className="flex items-center gap-1.5 text-xs font-display tracking-wider border border-fire/30 text-fire hover:bg-fire/10 px-3 py-1.5 rounded-sm transition-all"
          >
            <Icon name="Phone" size={12} />ГОСТЬ
          </a>
          <a
            href={`tel:${booking.agentPhone}`}
            className="flex items-center gap-1.5 text-xs font-display tracking-wider border border-gold/30 text-gold hover:bg-gold/10 px-3 py-1.5 rounded-sm transition-all"
          >
            <Icon name="Phone" size={12} />АГЕНТ
          </a>
          <button
            onClick={() => setShowTransfer(s => !s)}
            className="flex items-center gap-1.5 text-xs font-display tracking-wider border border-border hover:border-fire/40 hover:text-fire px-3 py-1.5 rounded-sm transition-all"
          >
            <Icon name="ArrowRight" size={12} />ПЕРЕНЕСТИ
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 text-xs font-display tracking-wider border border-border hover:border-red-500/50 hover:text-red-500 px-3 py-1.5 rounded-sm transition-all ml-auto"
          >
            <Icon name="X" size={12} />ОТМЕНИТЬ
          </button>
        </div>
      )}

      {showTransfer && (
        <TransferPanel
          booking={booking}
          onConfirm={confirmTransfer}
          onCancel={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}

// Admin calendar mini
function AdminCalendar({ bookings, selectedDate, onSelect }: {
  bookings: Booking[];
  selectedDate: string | null;
  onSelect: (d: string) => void;
}) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth = getDaysInMonth(view.year, view.month);
  const firstDay = getFirstDayOfMonth(view.year, view.month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const countForDate = (dateStr: string) =>
    bookings.filter(b => b.date === dateStr && b.status === "active").length;

  return (
    <div className="bg-surface border border-border rounded-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => view.month === 0
          ? setView({ year: view.year - 1, month: 11 })
          : setView({ ...view, month: view.month - 1 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <Icon name="ChevronLeft" size={14} className="text-muted-foreground" />
        </button>
        <span className="font-display text-sm tracking-wider">{MONTHS[view.month]} {view.year}</span>
        <button onClick={() => view.month === 11
          ? setView({ year: view.year + 1, month: 0 })
          : setView({ ...view, month: view.month + 1 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground/50 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = fmtDate(view.year, view.month, day);
          const count = countForDate(dateStr);
          const isSel = selectedDate === dateStr;
          const isToday = dateStr === fmtDate(today.getFullYear(), today.getMonth(), today.getDate());
          const dayFull = isDayFull(dateStr);
          const freeTotal = getDayFreeTotal(dateStr);
          const almostFull = !dayFull && freeTotal <= 4 && count > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center text-xs rounded-sm transition-all relative ${
                isSel ? "bg-fire text-white font-bold"
                : dayFull ? "bg-red-50 text-red-500 border border-red-200"
                : almostFull ? "bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30"
                : isToday ? "border border-fire/50 text-fire hover:bg-fire/10"
                : count > 0 ? "hover:bg-fire/10 text-foreground"
                : "hover:bg-white/5 text-muted-foreground/60"
              }`}
            >
              {day}
              {dayFull && !isSel && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[7px] text-red-500 leading-none">✕</span>
              )}
              {!dayFull && count > 0 && !isSel && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }, (_, j) => (
                    <div key={j} className={`w-1 h-1 rounded-full ${almostFull ? "bg-gold" : "bg-fire"}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-3 text-xs">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-fire" /><span className="text-muted-foreground">Выбран</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-gold/20 border border-gold/40" /><span className="text-muted-foreground">Мало мест</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" /><span className="text-muted-foreground">Занят</span></div>
      </div>
    </div>
  );
}

type AdminView = "bookings" | "calendar" | "quick" | "report" | "settings";

const NAV_TABS: { id: AdminView; label: string; icon: string }[] = [
  { id: "bookings", label: "ЗАПИСИ", icon: "List" },
  { id: "calendar", label: "КАЛЕНДАРЬ", icon: "Calendar" },
  { id: "quick", label: "ЗАПИСАТЬ", icon: "PlusCircle" },
  { id: "report", label: "СВЕРКА", icon: "BarChart2" },
  { id: "settings", label: "НАСТРОЙКИ", icon: "Settings" },
];

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<AdminView>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [showTransferList, setShowTransferList] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "cancelled">("active");
  const [search, setSearch] = useState("");

  const reload = () => setBookings(getBookings());

  useEffect(() => { if (authed) reload(); }, [authed]);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const today = new Date().toISOString().split("T")[0];

  let filtered = bookings;
  if (filterDate) filtered = filtered.filter(b => b.date === filterDate);
  if (filterStatus !== "all") filtered = filtered.filter(b => b.status === filterStatus);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b =>
      b.guestName.toLowerCase().includes(q) ||
      b.guestPhone.includes(q) ||
      b.agentName.toLowerCase().includes(q) ||
      b.agentCompany.toLowerCase().includes(q)
    );
  }
  filtered = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.slotTime.localeCompare(b.slotTime);
  });

  const activeCount = bookings.filter(b => b.status === "active").length;
  const todayCount = bookings.filter(b => b.date === today && b.status === "active").length;

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/85">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-fire transition-colors">
              <Icon name="ArrowLeft" size={14} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-fire rounded-sm flex items-center justify-center">
                <Icon name="Shield" size={14} className="text-white" />
              </div>
              <span className="font-display text-lg tracking-widest font-bold">QUAD<span className="text-fire">ADMIN</span></span>
            </div>
          </div>
          {/* Desktop nav */}
          <div className="hidden sm:flex gap-1">
            {NAV_TABS.map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wider rounded-sm transition-all ${
                  view === tab.id ? "bg-fire text-white" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon name={tab.icon} size={11} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-border/40">
          {NAV_TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-display tracking-wider transition-all ${
                view === tab.id ? "text-fire border-t-2 border-fire -mt-px" : "text-muted-foreground/60"
              }`}>
              <Icon name={tab.icon} size={14} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats — only on main views */}
        {(view === "bookings" || view === "calendar") && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Всего активных", value: activeCount, icon: "CheckCircle", color: "text-fire" },
              { label: "Сегодня", value: todayCount, icon: "Calendar", color: "text-fire" },
              { label: "Всего записей", value: bookings.length, icon: "List", color: "text-muted-foreground" },
            ].map(stat => (
              <div key={stat.label} className="bg-surface border border-border rounded-sm p-4 flex items-center gap-3">
                <Icon name={stat.icon} size={20} className={stat.color} />
                <div>
                  <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick booking */}
        {view === "quick" && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold tracking-wider flex items-center gap-2">
                <Icon name="PlusCircle" size={20} className="text-fire" />
                БЫСТРАЯ ЗАПИСЬ
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Запишите клиента прямо сейчас</p>
            </div>
            <QuickBooking onDone={() => { setView("bookings"); reload(); }} />
          </div>
        )}

        {/* Agent Report */}
        {view === "report" && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold tracking-wider flex items-center gap-2">
                <Icon name="BarChart2" size={20} className="text-fire" />
                СВЕРКА ПО АГЕНТАМ
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Продажи каждого агента, экспорт и печать</p>
            </div>
            <AgentReport bookings={bookings} />
          </div>
        )}

        {/* Settings */}
        {view === "settings" && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold tracking-wider flex items-center gap-2">
                <Icon name="Settings" size={20} className="text-fire" />
                НАСТРОЙКИ
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Управление слотами, компаниями и паролем</p>
            </div>
            <SettingsPanel />
          </div>
        )}

        {view === "calendar" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-3">ВЫБЕРИТЕ ДАТУ</h3>
              <AdminCalendar bookings={bookings} selectedDate={filterDate} onSelect={d => { setFilterDate(d); setView("bookings"); }} />
            </div>
            <div>
              <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-3">ЗАГРУЗКА ПО СЛОТАМ</h3>
              <div className="space-y-2">
                {filterDate ? getTimeSlots().map(slot => {
                  const cnt = bookings.filter(b => b.date === filterDate && b.slotId === slot.id && b.status === "active")
                    .reduce((s, b) => s + b.quadsCount, 0);
                  const pct = Math.round((cnt / slot.quadsTotal) * 100);
                  return (
                    <div key={slot.id} className="bg-surface border border-border rounded-sm p-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-display font-bold">{slot.time}</span>
                        <span className={cnt >= slot.quadsTotal ? "text-red-500" : cnt >= 5 ? "text-gold" : "text-fire"}>
                          {cnt}/{slot.quadsTotal}
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all bg-fire" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Выберите дату в календаре</p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "bookings" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <input
                type="text"
                placeholder="Поиск по имени, телефону..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-48 bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-2 text-sm outline-none"
              />
              <input
                type="date"
                value={filterDate || ""}
                onChange={e => setFilterDate(e.target.value || null)}
                className="bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-2 text-sm outline-none"
              />
              <div className="flex gap-1">
                {(["all","active","cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 text-xs font-display tracking-wider rounded-sm border transition-all ${
                      filterStatus === s ? "bg-fire border-fire text-white" : "border-border text-muted-foreground hover:border-fire/40"
                    }`}>
                    {s === "all" ? "ВСЕ" : s === "active" ? "АКТИВНЫЕ" : "ОТМЕНЁННЫЕ"}
                  </button>
                ))}
              </div>
              {filterDate && (
                <button
                  onClick={() => setShowTransferList(true)}
                  className="flex items-center gap-1.5 bg-fire/10 border border-fire/30 text-fire hover:bg-fire/20 px-3 py-2 text-xs font-display tracking-wider rounded-sm transition-all"
                >
                  <Icon name="Truck" size={12} />
                  СПИСОК ВОДИТЕЛЯ
                </button>
              )}
              {filterDate && (
                <button onClick={() => setFilterDate(null)} className="text-xs text-muted-foreground hover:text-fire transition-colors px-2">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            {/* Bookings list */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="CalendarX" size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display tracking-wider">ЗАПИСЕЙ НЕ НАЙДЕНО</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(b => (
                  <BookingCard key={b.id} booking={b} onUpdate={reload} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showTransferList && filterDate && (
        <TransferList date={filterDate} bookings={bookings} onClose={() => setShowTransferList(false)} />
      )}
    </div>
  );
}