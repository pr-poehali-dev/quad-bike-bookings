import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { BookingFormData } from "@/types/booking";

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

          let cls = "relative aspect-square flex items-center justify-center text-sm rounded-sm transition-all font-body ";
          if (isPast) {
            cls += "text-muted-foreground/25 cursor-not-allowed";
          } else if (isSel) {
            cls += "bg-fire text-white font-bold scale-110 shadow-lg shadow-fire/30";
          } else {
            cls += "hover:bg-fire/20 hover:text-fire cursor-pointer border border-transparent hover:border-fire/30";
          }

          return (
            <button key={dateStr} className={cls} disabled={isPast}
              onClick={() => { setSelected(dateStr); onSelect(dateStr); }}>
              {day}
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

interface AvailabilitySlot {
  id: string;
  time: string;
  label: string;
  quads_total: number;
  booked: number;
  free: number;
}

// STEP 2: Slot selection
function StepSlot({ date, onSelect }: { date: string; onSelect: (slotId: string, slotTime: string, free: number, quadsTotal: number) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getAvailability(date)
      .then((data: AvailabilitySlot[]) => {
        setSlots(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Не удалось загрузить слоты. Попробуйте позже.");
        setLoading(false);
      });
  }, [date]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  return (
    <div className="space-y-3">
      {slots.map(slot => {
        const free = slot.free;
        const isFull = free === 0;
        const isSel = selected === slot.id;

        let statusColor = "text-green-600";
        let statusBg = "bg-green-50 border-green-300";
        let dotColor = "bg-green-500";
        if (free <= 2 && free > 0) { statusColor = "text-gold"; statusBg = "bg-gold/15 border-gold/40"; dotColor = "bg-gold"; }
        if (isFull) { statusColor = "text-red-500"; statusBg = "bg-red-50 border-red-200"; dotColor = "bg-red-400"; }

        return (
          <button
            key={slot.id}
            disabled={isFull}
            onClick={() => { setSelected(slot.id); onSelect(slot.id, slot.time, slot.free, slot.quads_total); }}
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
                  {isFull ? "ЗАНЯТО" : `${free} из ${slot.quads_total} свободно`}
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
function StepQuads({ free, quadsTotal, onSelect }: { free: number; quadsTotal: number; onSelect: (count: number) => void }) {
  const [count, setCount] = useState(1);

  return (
    <div className="max-w-sm mx-auto text-center">
      <p className="text-muted-foreground mb-2 text-sm">Доступно: <span className="text-green-400 font-semibold">{free}</span> из {quadsTotal} квадроциклов</p>
      <p className="text-xs text-muted-foreground mb-8">Каждый квадроцикл двухместный</p>

      <div className="flex items-center justify-center gap-6 mb-10">
        <button
          onClick={() => setCount(c => Math.max(1, c - 1))}
          className="w-14 h-14 rounded-sm border border-border hover:border-fire/50 flex items-center justify-center transition-all hover:bg-fire/5"
        >
          <Icon name="Minus" size={22} />
        </button>

        <div className="text-center">
          <div className="font-display text-7xl font-bold text-fire leading-none">{count}</div>
          <div className="text-xs text-muted-foreground mt-2 font-display tracking-wider">КВАДРОЦИКЛ{count > 1 ? "А" : ""}</div>
        </div>

        <button
          onClick={() => setCount(c => Math.min(free, c + 1))}
          className="w-14 h-14 rounded-sm border border-border hover:border-fire/50 flex items-center justify-center transition-all hover:bg-fire/5"
        >
          <Icon name="Plus" size={22} />
        </button>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: quadsTotal }, (_, i) => (
          <button
            key={i}
            onClick={() => { if (i < free) setCount(i + 1); }}
            disabled={i >= free}
            className={`w-10 h-10 rounded-sm text-sm font-display border transition-all ${
              i < count ? "bg-fire border-fire text-white"
              : i < free ? "border-border hover:border-fire/40 hover:bg-fire/5"
              : "border-border/30 opacity-20 cursor-not-allowed"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mb-8">
        {count} квадроцикл{count > 1 ? "а" : ""} · до <span className="text-foreground font-semibold">{count * 2} человек</span>
      </div>

      <button
        onClick={() => onSelect(count)}
        className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-4 text-sm transition-all font-bold"
      >
        ВЫБРАТЬ {count} КВ. →
      </button>
    </div>
  );
}

// STEP 4: Form
function StepForm({ onSubmit }: { onSubmit: (data: BookingFormData) => void }) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyMode, setCompanyMode] = useState<"list" | "manual">("list");
  const [form, setForm] = useState<BookingFormData>({
    guestName: "", guestPhone: "", guestAddress: "",
    agentName: "", agentPhone: "", agentCompany: "",
    prepayment: "none", customPrepayment: "",
  });

  useEffect(() => {
    api.getCompanies()
      .then((data: string[]) => {
        setCompanies(data);
        if (data.length === 0) setCompanyMode("manual");
      })
      .catch(() => setCompanyMode("manual"));
  }, []);

  const set = (field: keyof BookingFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls = "w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40";
  const labelCls = "font-display text-xs tracking-wider text-muted-foreground block mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <h3 className="font-display text-sm tracking-widest text-fire mb-4 flex items-center gap-2">
          <Icon name="User" size={14} />
          ДАННЫЕ ГОСТЯ
        </h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ИМЯ И ФАМИЛИЯ *</label>
            <input type="text" required value={form.guestName}
              onChange={e => set("guestName", e.target.value)}
              placeholder="Иван Петров" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН *</label>
            <input type="tel" required value={form.guestPhone}
              onChange={e => set("guestPhone", e.target.value)}
              placeholder="+7 (999) 000-00-00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>АДРЕС ДЛЯ ТРАНСФЕРА *</label>
            <input type="text" required value={form.guestAddress}
              onChange={e => set("guestAddress", e.target.value)}
              placeholder="Отель / улица / ориентир" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-6">
        <h3 className="font-display text-sm tracking-widest text-gold mb-4 flex items-center gap-2">
          <Icon name="Briefcase" size={14} />
          АГЕНТ / ПОСРЕДНИК
        </h3>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>ИМЯ АГЕНТА</label>
            <input type="text" value={form.agentName}
              onChange={e => set("agentName", e.target.value)}
              placeholder="Не обязательно" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН АГЕНТА</label>
            <input type="tel" value={form.agentPhone}
              onChange={e => set("agentPhone", e.target.value)}
              placeholder="+7 (999) 000-00-00" className={inputCls} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelCls} mb-0`}>КОМПАНИЯ</label>
              {companies.length > 0 && (
                <button type="button"
                  onClick={() => setCompanyMode(m => m === "list" ? "manual" : "list")}
                  className="text-xs text-muted-foreground hover:text-fire transition-colors font-display tracking-wider">
                  {companyMode === "list" ? "ВВЕСТИ ВРУЧНУЮ" : "ВЫБРАТЬ ИЗ СПИСКА"}
                </button>
              )}
            </div>
            {companyMode === "list" && companies.length > 0 ? (
              <select value={form.agentCompany}
                onChange={e => set("agentCompany", e.target.value)}
                className={inputCls}>
                <option value="">— Выберите компанию —</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__manual__">Другая...</option>
              </select>
            ) : (
              <input type="text" value={form.agentCompany}
                onChange={e => set("agentCompany", e.target.value)}
                placeholder="Название компании" className={inputCls} />
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-6">
        <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Icon name="Banknote" size={14} />
          ПРЕДОПЛАТА
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["1000","2000","3000","5000","custom","none"].map(val => (
            <button key={val} type="button" onClick={() => set("prepayment", val)}
              className={`py-3 px-3 rounded-sm text-sm font-display tracking-wider border transition-all ${
                form.prepayment === val
                  ? val === "none" ? "bg-muted border-muted-foreground/40 text-foreground" : "bg-fire border-fire text-white"
                  : "border-border hover:border-fire/40 text-muted-foreground"
              }`}>
              {val === "custom" ? "СВОЯ" : val === "none" ? "НЕТ" : `${val}₽`}
            </button>
          ))}
        </div>
        {form.prepayment === "custom" && (
          <input type="number" value={form.customPrepayment}
            onChange={e => set("customPrepayment", e.target.value)}
            placeholder="Сумма предоплаты" className={inputCls} />
        )}
      </div>

      <button type="submit"
        className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-4 text-sm transition-all font-bold flex items-center justify-center gap-2">
        <Icon name="CheckCircle" size={16} />
        ПОДТВЕРДИТЬ ЗАПИСЬ →
      </button>
    </form>
  );
}

// STEP 5: Success
function StepSuccess({ name, date, slotTime, quadsCount, onReset }: {
  name: string; date: string; slotTime: string; quadsCount: number; onReset: () => void;
}) {
  return (
    <div className="text-center py-8 max-w-sm mx-auto">
      <div className="w-20 h-20 bg-fire/15 border border-fire/30 rounded-sm flex items-center justify-center mx-auto mb-6">
        <Icon name="CheckCircle" size={40} className="text-fire" />
      </div>
      <h2 className="font-display text-3xl font-bold tracking-wider mb-2">ГОТОВО!</h2>
      <p className="text-muted-foreground mb-6">Ваша запись подтверждена</p>
      <div className="bg-surface border border-border rounded-sm p-5 text-left space-y-2 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Гость</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Дата</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Время</span>
          <span>{slotTime}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Квадроциклов</span>
          <span className="text-fire font-bold">{quadsCount}</span>
        </div>
      </div>
      <button onClick={onReset}
        className="w-full border border-border hover:border-fire/40 hover:text-fire font-display tracking-wider py-3 text-sm transition-all rounded-sm">
        НОВАЯ ЗАПИСЬ
      </button>
    </div>
  );
}

const STEPS = ["ДАТА", "ВРЕМЯ", "КВАДРЫ", "ДАННЫЕ"];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotFree, setSlotFree] = useState(0);
  const [slotQuadsTotal, setSlotQuadsTotal] = useState(7);
  const [quadsCount, setQuadsCount] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ name: string; date: string; slotTime: string; quadsCount: number } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFormSubmit = async (form: BookingFormData) => {
    setSubmitting(true);
    const prepaymentValue = form.prepayment === "none" ? null
      : form.prepayment === "custom" ? (Number(form.customPrepayment) || null)
      : Number(form.prepayment);

    try {
      await api.book({
        date,
        slotId,
        quadsCount,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestAddress: form.guestAddress,
        agentName: form.agentName,
        agentPhone: form.agentPhone,
        agentCompany: form.agentCompany,
        prepayment: prepaymentValue,
      });
      setSuccessData({ name: form.guestName, date, slotTime, quadsCount });
      setDone(true);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 409) {
        showToast("Нет мест! Выберите другой слот");
        setStep(1);
      } else {
        showToast(apiErr?.message || "Ошибка при бронировании. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setDate("");
    setSlotId("");
    setSlotTime("");
    setSlotFree(0);
    setSlotQuadsTotal(7);
    setQuadsCount(1);
    setDone(false);
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/85">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.poehali.dev/projects/ff99e67c-206b-434b-a8cd-0f0f14c676c8/bucket/b2241d70-0bb1-489f-969c-387d997f395f.jpg"
              alt="Квадролидер Анапа"
              className="w-9 h-9 rounded-full object-cover opacity-90"
            />
            <span className="font-display text-lg tracking-widest font-bold">КВАДРО<span className="text-fire">ЛИДЕР</span></span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-sm shadow-lg font-display tracking-wider text-sm animate-fade-in">
            {toast}
          </div>
        )}

        {done && successData ? (
          <StepSuccess
            name={successData.name}
            date={successData.date}
            slotTime={successData.slotTime}
            quadsCount={successData.quadsCount}
            onReset={reset}
          />
        ) : (
          <>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-display tracking-wider transition-all ${
                    i === step ? "text-fire" : i < step ? "text-muted-foreground" : "text-muted-foreground/30"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      i < step ? "bg-fire/20 border-fire/40 text-fire"
                      : i === step ? "bg-fire border-fire text-white"
                      : "border-border/40"
                    }`}>
                      {i < step ? <Icon name="Check" size={10} /> : i + 1}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-px transition-all ${i < step ? "bg-fire/40" : "bg-border/40"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step title */}
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl font-bold tracking-wider">
                {step === 0 && "ВЫБЕРИТЕ ДАТУ"}
                {step === 1 && "ВЫБЕРИТЕ ВРЕМЯ"}
                {step === 2 && "КОЛИЧЕСТВО КВАДРОЦИКЛОВ"}
                {step === 3 && "ДАННЫЕ ДЛЯ ЗАПИСИ"}
              </h2>
              {date && step > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {date}{slotTime && ` · ${slotTime}`}{step > 2 && ` · ${quadsCount} кв.`}
                </p>
              )}
            </div>

            {/* Back button */}
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-fire transition-colors mb-5">
                <Icon name="ArrowLeft" size={14} />
                Назад
              </button>
            )}

            {step === 0 && (
              <StepCalendar onSelect={d => { setDate(d); setStep(1); }} />
            )}
            {step === 1 && (
              <StepSlot date={date} onSelect={(id, time, free, total) => {
                setSlotId(id);
                setSlotTime(time);
                setSlotFree(free);
                setSlotQuadsTotal(total);
                setStep(2);
              }} />
            )}
            {step === 2 && (
              <StepQuads free={slotFree} quadsTotal={slotQuadsTotal} onSelect={count => {
                setQuadsCount(count);
                setStep(3);
              }} />
            )}
            {step === 3 && (
              submitting
                ? <div className="text-center py-12 text-muted-foreground">Отправка...</div>
                : <StepForm onSubmit={handleFormSubmit} />
            )}
          </>
        )}
      </div>
    </div>
  );
}