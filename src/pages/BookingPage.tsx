import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getTimeSlots, getSlotBookedCount, addBooking, isDayFull, getDayFreeTotal, getCompanies } from "@/lib/bookingStore";
import { BookingFormData, TimeSlot } from "@/types/booking";

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_OF_WEEK = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function todayDate() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth(), day: t.getDate() };
}
function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// STEP 1: Calendar
function StepCalendar({ onSelect }: { onSelect: (date: string) => void }) {
  const td = todayDate();
  const [view, setView] = useState({ year: td.year, month: td.month });
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(view.year, view.month);
  const firstDay = getFirstDayOfMonth(view.year, view.month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => view.month === 0
    ? setView({ year: view.year - 1, month: 11 })
    : setView({ ...view, month: view.month - 1 });
  const nextMonth = () => view.month === 11
    ? setView({ year: view.year + 1, month: 0 })
    : setView({ ...view, month: view.month + 1 });

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-white/10 transition-colors border border-border">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>
        <span className="font-display text-xl tracking-wider font-bold">
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-white/10 transition-colors border border-border">
          <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-display tracking-wider py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = fmtDate(view.year, view.month, day);
          const isPast = new Date(view.year, view.month, day) < new Date(td.year, td.month, td.day);
          const isSel = selected === dateStr;
          const dayFull = !isPast && isDayFull(dateStr);
          const freeTotal = !isPast && !dayFull ? getDayFreeTotal(dateStr) : 0;
          const dayBusy = !isPast && !dayFull && freeTotal <= 4; // мало мест по всему дню

          let cls = "relative aspect-square flex items-center justify-center text-sm rounded-sm transition-all font-body ";
          if (isPast) {
            cls += "text-muted-foreground/25 cursor-not-allowed";
          } else if (isSel) {
            cls += "bg-fire text-white font-bold scale-110 shadow-lg shadow-fire/30";
          } else if (dayFull) {
            cls += "bg-red-100 text-red-500 border border-red-200 cursor-not-allowed line-through";
          } else if (dayBusy) {
            cls += "bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 cursor-pointer";
          } else {
            cls += "hover:bg-fire/20 hover:text-fire cursor-pointer border border-transparent hover:border-fire/30";
          }

          return (
            <button key={dateStr} className={cls} disabled={isPast || dayFull}
              onClick={() => { setSelected(dateStr); onSelect(dateStr); }}>
              {day}
              {dayFull && !isPast && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-red-500 leading-none">✕</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border border-transparent bg-background" />
          <span className="text-muted-foreground">Свободно</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gold/20 border border-gold/40" />
          <span className="text-muted-foreground">Мало мест</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          <span className="text-muted-foreground">День занят</span>
        </div>
      </div>
    </div>
  );
}

// STEP 2: Slot selection
function StepSlot({ date, onSelect }: { date: string; onSelect: (slotId: string, slotTime: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  useEffect(() => { setSlots(getTimeSlots()); }, []);

  return (
    <div className="space-y-3">
      {slots.map(slot => {
        const booked = getSlotBookedCount(date, slot.id);
        const free = slot.quadsTotal - booked;
        const isFull = free === 0;
        const isSel = selected === slot.id;

        let statusColor = "text-fire";
        let statusBg = "bg-fire/10 border-fire/30";
        let dotColor = "bg-fire";
        if (free <= 2 && free > 0) { statusColor = "text-gold"; statusBg = "bg-gold/15 border-gold/40"; dotColor = "bg-gold"; }
        if (isFull) { statusColor = "text-red-500"; statusBg = "bg-red-50 border-red-200"; dotColor = "bg-red-400"; }

        return (
          <button
            key={slot.id}
            disabled={isFull}
            onClick={() => { setSelected(slot.id); onSelect(slot.id, slot.time); }}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-sm border transition-all ${
              isFull ? "opacity-40 cursor-not-allowed bg-surface border-border"
              : isSel ? "bg-fire/15 border-fire shadow-sm shadow-fire/20"
              : "bg-surface border-border hover:border-fire/40 hover:bg-fire/5 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="font-display text-2xl font-bold tracking-wider w-16 text-left">
                {slot.time}
              </span>
              <span className="text-sm text-muted-foreground">{slot.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-xs font-display tracking-wider px-3 py-1 rounded-sm border ${statusBg} ${statusColor}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor} ${!isFull ? 'animate-pulse' : ''}`} />
                  {isFull ? "ЗАНЯТО" : `${free} из ${slot.quadsTotal} свободно`}
                </div>
              </div>
              {isSel && <Icon name="CheckCircle" size={18} className="text-fire" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// STEP 3: Quads count
function StepQuads({ slotId, date, onSelect }: { slotId: string; date: string; onSelect: (count: number) => void }) {
  const [count, setCount] = useState(1);
  const slots = getTimeSlots();
  const slot = slots.find(s => s.id === slotId);
  const total = slot?.quadsTotal ?? 7;
  const booked = getSlotBookedCount(date, slotId);
  const free = total - booked;

  return (
    <div className="max-w-sm mx-auto text-center">
      <p className="text-muted-foreground mb-2 text-sm">Доступно: <span className="text-green-400 font-semibold">{free}</span> из {total} квадроциклов</p>
      <p className="text-xs text-muted-foreground mb-8">Каждый квадроцикл двухместный</p>

      <div className="flex items-center justify-center gap-6 mb-10">
        <button
          onClick={() => setCount(c => Math.max(1, c - 1))}
          className="w-14 h-14 rounded-sm border border-border hover:border-fire/50 flex items-center justify-center transition-all hover:bg-fire/10 text-xl font-bold"
        >−</button>
        <div className="text-center">
          <div className="font-display text-7xl font-bold text-fire leading-none">{count}</div>
          <div className="text-xs text-muted-foreground mt-2">квадроциклов</div>
          <div className="text-xs text-muted-foreground">до {count * 2} чел.</div>
        </div>
        <button
          onClick={() => setCount(c => Math.min(free, c + 1))}
          className="w-14 h-14 rounded-sm border border-border hover:border-fire/50 flex items-center justify-center transition-all hover:bg-fire/10 text-xl font-bold"
        >+</button>
      </div>

      <div className="flex gap-2 justify-center mb-8">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all`}
            onClick={() => { if (i < free) setCount(i + 1); }}
          >
            <div className={`w-8 h-8 rounded-sm border flex items-center justify-center text-xs font-display transition-all ${
              i < count ? "bg-fire border-fire text-white" : i < free ? "border-border hover:border-fire/40" : "border-border/30 opacity-30"
            }`}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(count)}
        className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-4 text-sm transition-all"
      >
        ДАЛЕЕ — {count} {count === 1 ? "КВАДРОЦИКЛ" : count < 5 ? "КВАДРОЦИКЛА" : "КВАДРОЦИКЛОВ"}
      </button>
    </div>
  );
}

// STEP 4: Guest + Agent + Prepayment form
function StepForm({
  onSubmit,
}: {
  onSubmit: (data: BookingFormData) => void;
}) {
  const [form, setForm] = useState<BookingFormData>({
    guestName: "", guestPhone: "", guestAddress: "",
    agentName: "", agentPhone: "", agentCompany: "",
    prepayment: "none", customPrepayment: "",
  });
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyMode, setCompanyMode] = useState<"list" | "manual">("list");

  useEffect(() => {
    const c = getCompanies();
    setCompanies(c);
    if (c.length === 0) setCompanyMode("manual");
  }, []);

  const set = (k: keyof BookingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls = "w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40";
  const labelCls = "font-display text-xs tracking-wider text-muted-foreground block mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest */}
      <div className="bg-surface/50 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-fire mb-4 flex items-center gap-2">
          <Icon name="User" size={14} />
          ДАННЫЕ ГОСТЯ
        </h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ИМЯ И ФАМИЛИЯ *</label>
            <input type="text" required placeholder="Иван Петров" value={form.guestName} onChange={set("guestName")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН *</label>
            <input type="tel" required placeholder="+7 (999) 000-00-00" value={form.guestPhone} onChange={set("guestPhone")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>АДРЕС ДЛЯ ТРАНСФЕРА *</label>
            <input type="text" required placeholder="Отель / улица / ориентир" value={form.guestAddress} onChange={set("guestAddress")} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Agent */}
      <div className="bg-surface/50 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-gold mb-4 flex items-center gap-2">
          <Icon name="Briefcase" size={14} />
          ДАННЫЕ АГЕНТА
        </h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ИМЯ АГЕНТА *</label>
            <input type="text" required placeholder="Мария Иванова" value={form.agentName} onChange={set("agentName")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН АГЕНТА *</label>
            <input type="tel" required placeholder="+7 (999) 000-00-00" value={form.agentPhone} onChange={set("agentPhone")} className={inputCls} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelCls} mb-0`}>КОМПАНИЯ *</label>
              {companies.length > 0 && (
                <button type="button"
                  onClick={() => { setCompanyMode(m => m === "list" ? "manual" : "list"); setForm(f => ({ ...f, agentCompany: "" })); }}
                  className="text-xs text-muted-foreground hover:text-fire transition-colors font-display tracking-wider">
                  {companyMode === "list" ? "ВВЕСТИ ВРУЧНУЮ" : "ВЫБРАТЬ ИЗ СПИСКА"}
                </button>
              )}
            </div>
            {companyMode === "list" && companies.length > 0 ? (
              <select required value={form.agentCompany} onChange={set("agentCompany")} className={inputCls}>
                <option value="">— Выберите компанию —</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" required placeholder="Название турагентства" value={form.agentCompany} onChange={set("agentCompany")} className={inputCls} />
            )}
          </div>
        </div>
      </div>

      {/* Prepayment */}
      <div className="bg-surface/50 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Icon name="Banknote" size={14} />
          ПРЕДОПЛАТА
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["1000", "2000", "3000", "5000", "custom", "none"].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setForm(f => ({ ...f, prepayment: val }))}
              className={`py-2.5 px-3 rounded-sm text-sm font-display tracking-wider border transition-all ${
                form.prepayment === val
                  ? val === "none" ? "bg-muted border-muted-foreground/40 text-foreground" : "bg-fire border-fire text-white"
                  : "border-border hover:border-fire/40 text-muted-foreground"
              }`}
            >
              {val === "custom" ? "СВОЯ" : val === "none" ? "НЕТ" : `${val}₽`}
            </button>
          ))}
        </div>
        {form.prepayment === "custom" && (
          <div>
            <label className={labelCls}>СУММА ПРЕДОПЛАТЫ</label>
            <input type="number" placeholder="Введите сумму" value={form.customPrepayment} onChange={set("customPrepayment")}
              className={inputCls} />
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-4 text-base transition-all font-bold">
        ЗАБРОНИРОВАТЬ →
      </button>
    </form>
  );
}

// Success screen
function BookingSuccess({ bookingId, onNew }: { bookingId: string; onNew: () => void }) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-20 h-20 bg-fire/15 border border-fire/30 rounded-sm flex items-center justify-center mx-auto mb-6 animate-pulse-fire">
        <Icon name="CheckCircle" size={40} className="text-fire" />
      </div>
      <h3 className="font-display text-4xl font-bold mb-3">ЗАБРОНИРОВАНО!</h3>
      <p className="text-muted-foreground mb-1 text-sm">Номер брони:</p>
      <p className="font-display text-xl text-fire tracking-widest mb-6">{bookingId.toUpperCase()}</p>
      <p className="text-sm text-muted-foreground mb-8">Запись сохранена в системе</p>
      <button onClick={onNew} className="font-display tracking-wider text-sm border border-border hover:border-fire/50 px-8 py-3 rounded-sm transition-all">
        НОВАЯ ЗАПИСЬ
      </button>
    </div>
  );
}

const STEPS = ["Дата", "Время", "Квадры", "Детали"];

export default function BookingPage({ onAdminClick }: { onAdminClick: () => void }) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [quadsCount, setQuadsCount] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleDateSelect = (d: string) => { setDate(d); setStep(1); };
  const handleSlotSelect = (id: string, time: string) => { setSlotId(id); setSlotTime(time); setStep(2); };
  const handleQuadsSelect = (c: number) => { setQuadsCount(c); setStep(3); };

  const handleFormSubmit = (data: BookingFormData) => {
    const id = `bk-${Date.now().toString(36)}`;
    addBooking({
      id,
      date: date!,
      slotId: slotId!,
      slotTime: slotTime!,
      quadsCount: quadsCount!,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestAddress: data.guestAddress,
      agentName: data.agentName,
      agentPhone: data.agentPhone,
      agentCompany: data.agentCompany,
      prepayment: data.prepayment === "none"
        ? null
        : data.prepayment === "custom"
        ? Number(data.customPrepayment) || null
        : Number(data.prepayment),
      status: "active",
      createdAt: new Date().toISOString(),
    });
    setBookingId(id);
    setStep(4);
  };

  const reset = () => {
    setStep(0); setDate(null); setSlotId(null); setSlotTime(null);
    setQuadsCount(null); setBookingId(null);
  };

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/85">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.poehali.dev/projects/ff99e67c-206b-434b-a8cd-0f0f14c676c8/bucket/b2241d70-0bb1-489f-969c-387d997f395f.jpg"
              alt="Квадролидер Анапа"
              className="w-9 h-9 rounded-full object-cover opacity-90"
            />
            <span className="font-display text-lg tracking-widest font-bold">КВАДРО<span className="text-fire">ЛИДЕР</span></span>
          </div>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 text-xs font-display tracking-wider text-muted-foreground hover:text-fire transition-colors border border-border hover:border-fire/40 px-3 py-1.5 rounded-sm"
          >
            <Icon name="Lock" size={12} />
            ADMIN
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step < 4 && (
          <>
            {/* Progress */}
            <div className="flex items-center gap-1 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center gap-1.5 ${i <= step ? "text-fire" : "text-muted-foreground/40"}`}>
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-display font-bold border transition-all ${
                      i < step ? "bg-fire border-fire text-white"
                      : i === step ? "border-fire text-fire"
                      : "border-border/40"
                    }`}>{i + 1}</div>
                    <span className="text-xs font-display tracking-wider hidden sm:block">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < step ? "bg-fire/60" : "bg-border/40"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Summary bar */}
            {step > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {date && (
                  <button onClick={() => setStep(0)} className="flex items-center gap-1.5 bg-surface border border-fire/30 rounded-sm px-3 py-1.5 text-xs font-display tracking-wider text-fire hover:bg-fire/10 transition-colors">
                    <Icon name="Calendar" size={12} />
                    {date}
                  </button>
                )}
                {slotTime && (
                  <button onClick={() => setStep(1)} className="flex items-center gap-1.5 bg-surface border border-fire/30 rounded-sm px-3 py-1.5 text-xs font-display tracking-wider text-fire hover:bg-fire/10 transition-colors">
                    <Icon name="Clock" size={12} />
                    {slotTime}
                  </button>
                )}
                {quadsCount && (
                  <button onClick={() => setStep(2)} className="flex items-center gap-1.5 bg-surface border border-fire/30 rounded-sm px-3 py-1.5 text-xs font-display tracking-wider text-fire hover:bg-fire/10 transition-colors">
                    <Icon name="Bike" size={12} />
                    {quadsCount} кв.
                  </button>
                )}
              </div>
            )}

            {/* Step titles */}
            <div className="mb-8">
              <span className="font-display text-xs tracking-widest text-fire uppercase block mb-1">
                Шаг {step + 1} из {STEPS.length}
              </span>
              <h2 className="font-display text-3xl font-bold">
                {["ВЫБЕРИТЕ ДАТУ", "ВЫБЕРИТЕ ВРЕМЯ", "КОЛИЧЕСТВО КВАДРОЦИКЛОВ", "ЗАПОЛНИТЕ ДАННЫЕ"][step]}
              </h2>
            </div>
          </>
        )}

        {/* Steps */}
        {step === 0 && <StepCalendar onSelect={handleDateSelect} />}
        {step === 1 && date && <StepSlot date={date} onSelect={handleSlotSelect} />}
        {step === 2 && date && slotId && <StepQuads date={date} slotId={slotId} onSelect={handleQuadsSelect} />}
        {step === 3 && <StepForm onSubmit={handleFormSubmit} />}
        {step === 4 && bookingId && <BookingSuccess bookingId={bookingId} onNew={reset} />}
      </div>
    </div>
  );
}