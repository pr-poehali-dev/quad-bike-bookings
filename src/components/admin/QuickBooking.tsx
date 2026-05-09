import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { TimeSlot } from "@/types/booking";

const inputCls = "w-full bg-background border border-border focus:border-fire/60 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40";
const labelCls = "font-display text-xs tracking-wider text-muted-foreground block mb-1.5";

interface QuickBookingProps {
  onDone: () => void;
}

interface AvailabilitySlot {
  id: string;
  time: string;
  label: string;
  quads_total: number;
  booked: number;
  free: number;
}

export default function QuickBooking({ onDone }: QuickBookingProps) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotId, setSlotId] = useState("");
  const [quadsCount, setQuadsCount] = useState(1);
  const [maxFree, setMaxFree] = useState(7);
  const [availMap, setAvailMap] = useState<Record<string, number>>({}); // slotId -> free
  const [availLoading, setAvailLoading] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyMode, setCompanyMode] = useState<"list" | "manual">("list");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentCompany, setAgentCompany] = useState("");
  const [prepayment, setPrepayment] = useState("none");
  const [customPrepayment, setCustomPrepayment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // Load slots and companies on mount
  useEffect(() => {
    setSlotsLoading(true);
    Promise.all([
      api.getSlots(),
      api.getCompanies(),
    ]).then(([slotsData, companiesData]: [{ id: string; time: string; label: string; quads_total: number }[], string[]]) => {
      const mapped: TimeSlot[] = slotsData.map(s => ({
        id: s.id,
        time: s.time,
        label: s.label,
        quadsTotal: s.quads_total,
        quadsBooked: 0,
      }));
      setSlots(mapped);
      if (mapped.length > 0) setSlotId(mapped[0].id);
      setCompanies(companiesData);
      if (companiesData.length === 0) setCompanyMode("manual");
    }).catch(() => {}).finally(() => setSlotsLoading(false));
  }, []);

  // Fetch availability when date changes
  useEffect(() => {
    if (!date) return;
    setAvailLoading(true);
    api.getAvailability(date)
      .then((data: AvailabilitySlot[]) => {
        const map: Record<string, number> = {};
        data.forEach(s => { map[s.id] = s.free; });
        setAvailMap(map);
      })
      .catch(() => {})
      .finally(() => setAvailLoading(false));
  }, [date]);

  // Update maxFree when slotId or availMap changes
  useEffect(() => {
    if (!slotId) return;
    const free = availMap[slotId] ?? 0;
    setMaxFree(free);
    if (quadsCount > free) setQuadsCount(Math.max(1, free));
  }, [slotId, availMap]);

  const selectedSlot = slots.find(s => s.id === slotId);
  const isFull = maxFree === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotId || !selectedSlot || isFull) return;
    setSubmitting(true);
    setSubmitError(null);
    const prepaymentValue = prepayment === "none" ? null
      : prepayment === "custom" ? (Number(customPrepayment) || null)
      : Number(prepayment);
    try {
      const result = await api.book({
        date,
        slotId,
        quadsCount,
        guestName,
        guestPhone,
        guestAddress,
        agentName,
        agentPhone,
        agentCompany,
        prepayment: prepaymentValue,
      });
      setBookingId((result as { id?: string })?.id || "");
      setDone(true);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 409) {
        setSubmitError("Нет мест! Выберите другой слот или дату.");
        // refresh availability
        api.getAvailability(date).then((data: AvailabilitySlot[]) => {
          const map: Record<string, number> = {};
          data.forEach(s => { map[s.id] = s.free; });
          setAvailMap(map);
        }).catch(() => {});
      } else {
        setSubmitError(apiErr?.message || "Ошибка при бронировании. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="text-center py-10">
      <div className="w-16 h-16 bg-fire/15 border border-fire/30 rounded-sm flex items-center justify-center mx-auto mb-4">
        <Icon name="CheckCircle" size={32} className="text-fire" />
      </div>
      <h3 className="font-display text-2xl font-bold mb-1">ЗАПИСАНО!</h3>
      <p className="text-muted-foreground text-sm mb-1">Номер брони: <span className="text-fire font-display">{String(bookingId).toUpperCase()}</span></p>
      <p className="text-xs text-muted-foreground mb-6">{guestName} · {date} · {selectedSlot?.time} · {quadsCount} кв.</p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => {
            setDone(false);
            setGuestName(""); setGuestPhone(""); setGuestAddress("");
            setAgentName(""); setAgentPhone(""); setAgentCompany("");
            setPrepayment("none"); setCustomPrepayment("");
            setSubmitError(null);
          }}
          className="font-display text-xs tracking-wider border border-border hover:border-fire/40 px-5 py-2.5 rounded-sm transition-all"
        >
          ЕЩЁ ЗАПИСЬ
        </button>
        <button onClick={onDone} className="font-display text-xs tracking-wider bg-fire text-white px-5 py-2.5 rounded-sm hover:bg-fire/85 transition-all">
          К ЗАПИСЯМ
        </button>
      </div>
    </div>
  );

  if (slotsLoading) return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

      {/* Дата и слот */}
      <div className="bg-surface/40 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-fire mb-4 flex items-center gap-2">
          <Icon name="Calendar" size={14} />
          ДАТА И ВРЕМЯ
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>ДАТА</label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ВРЕМЕННОЙ СЛОТ</label>
            <select
              value={slotId}
              onChange={e => setSlotId(e.target.value)}
              className={inputCls}
            >
              {slots.map(s => {
                const free = availMap[s.id] ?? "—";
                const isFreeNum = typeof free === "number";
                return (
                  <option key={s.id} value={s.id} disabled={isFreeNum && (free as number) === 0}>
                    {s.time} — {s.label} {availLoading ? "" : `(${isFreeNum && (free as number) > 0 ? `свободно ${free}` : "занято"})`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Количество квадров */}
        <div>
          <label className={labelCls}>КОЛИЧЕСТВО КВАДРОЦИКЛОВ {isFull && <span className="text-red-500">— СЛОТ ЗАНЯТ</span>}</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQuadsCount(c => Math.max(1, c - 1))}
              className="w-10 h-10 border border-border rounded-sm hover:border-fire/50 hover:bg-fire/10 flex items-center justify-center font-bold text-lg transition-all">−</button>
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: selectedSlot?.quadsTotal || 7 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (i < maxFree) setQuadsCount(i + 1); }}
                  className={`flex-1 h-9 rounded-sm text-xs font-display border transition-all ${
                    i < quadsCount ? "bg-fire border-fire text-white"
                    : i < maxFree ? "border-border hover:border-fire/40"
                    : "border-border/30 opacity-25 cursor-not-allowed"
                  }`}
                >{i + 1}</button>
              ))}
            </div>
            <button type="button" onClick={() => setQuadsCount(c => Math.min(maxFree, c + 1))}
              className="w-10 h-10 border border-border rounded-sm hover:border-fire/50 hover:bg-fire/10 flex items-center justify-center font-bold text-lg transition-all">+</button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {quadsCount} квадр. · до {quadsCount * 2} чел. · свободно {availLoading ? "..." : maxFree} из {selectedSlot?.quadsTotal || 7}
          </p>
        </div>
      </div>

      {/* Гость */}
      <div className="bg-surface/40 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-fire mb-4 flex items-center gap-2">
          <Icon name="User" size={14} />
          ДАННЫЕ ГОСТЯ
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>ИМЯ И ФАМИЛИЯ *</label>
            <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Иван Петров" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН *</label>
            <input type="tel" required value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+7 (999) 000-00-00" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>АДРЕС ДЛЯ ТРАНСФЕРА *</label>
            <input type="text" required value={guestAddress} onChange={e => setGuestAddress(e.target.value)} placeholder="Отель / улица / ориентир" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Агент */}
      <div className="bg-surface/40 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-gold mb-4 flex items-center gap-2">
          <Icon name="Briefcase" size={14} />
          АГЕНТ
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>ИМЯ АГЕНТА</label>
            <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Не обязательно" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ТЕЛЕФОН АГЕНТА</label>
            <input type="tel" value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="+7 (999) 000-00-00" className={inputCls} />
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelCls} mb-0`}>КОМПАНИЯ</label>
              {companies.length > 0 && (
                <button type="button" onClick={() => setCompanyMode(m => m === "list" ? "manual" : "list")}
                  className="text-xs text-muted-foreground hover:text-fire transition-colors font-display tracking-wider">
                  {companyMode === "list" ? "ВВЕСТИ ВРУЧНУЮ" : "ВЫБРАТЬ ИЗ СПИСКА"}
                </button>
              )}
            </div>
            {companyMode === "list" && companies.length > 0 ? (
              <select value={agentCompany} onChange={e => setAgentCompany(e.target.value)} className={inputCls}>
                <option value="">— Выберите компанию —</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__manual__">Другая...</option>
              </select>
            ) : (
              <input type="text" value={agentCompany} onChange={e => setAgentCompany(e.target.value)} placeholder="Название компании" className={inputCls} />
            )}
          </div>
        </div>
      </div>

      {/* Предоплата */}
      <div className="bg-surface/40 border border-border rounded-sm p-5">
        <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Icon name="Banknote" size={14} />
          ПРЕДОПЛАТА
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["1000","2000","3000","5000","custom","none"].map(val => (
            <button key={val} type="button" onClick={() => setPrepayment(val)}
              className={`py-2.5 px-3 rounded-sm text-sm font-display tracking-wider border transition-all ${
                prepayment === val
                  ? val === "none" ? "bg-muted border-muted-foreground/40 text-foreground" : "bg-fire border-fire text-white"
                  : "border-border hover:border-fire/40 text-muted-foreground"
              }`}>
              {val === "custom" ? "СВОЯ" : val === "none" ? "НЕТ" : `${val}₽`}
            </button>
          ))}
        </div>
        {prepayment === "custom" && (
          <input type="number" value={customPrepayment} onChange={e => setCustomPrepayment(e.target.value)}
            placeholder="Сумма предоплаты" className={inputCls} />
        )}
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-sm px-4 py-3 text-sm font-display tracking-wider">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isFull || submitting}
        className="w-full bg-fire hover:bg-fire/85 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display tracking-widest py-4 text-sm transition-all font-bold flex items-center justify-center gap-2"
      >
        <Icon name="CheckCircle" size={16} />
        {submitting ? "ЗАПИСЬ..." : "ЗАПИСАТЬ КЛИЕНТА"}
      </button>
    </form>
  );
}
