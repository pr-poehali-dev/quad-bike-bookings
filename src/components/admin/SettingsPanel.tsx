import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { TimeSlot } from "@/types/booking";
import { api } from "@/lib/api";

const inputCls = "w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40";
const labelCls = "font-display text-xs tracking-wider text-muted-foreground block mb-1.5";
const sectionCls = "bg-surface/40 border border-border rounded-sm p-5";

export default function SettingsPanel() {
  // --- Slots ---
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsSaving, setSlotsSaving] = useState(false);
  const [slotsSaved, setSlotsSaved] = useState(false);

  // --- Password ---
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // --- Companies ---
  const [companies, setCompanies] = useState<string[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesSaving, setCompaniesSaving] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [companiesSaved, setCompaniesSaved] = useState(false);

  useEffect(() => {
    setSlotsLoading(true);
    api.getSlots()
      .then((data: { id: string; time: string; label: string; quads_total: number }[]) => {
        setSlots(data.map(s => ({
          id: s.id,
          time: s.time,
          label: s.label,
          quadsTotal: s.quads_total,
          quadsBooked: 0,
        })));
      })
      .catch(() => {})
      .finally(() => setSlotsLoading(false));

    setCompaniesLoading(true);
    api.getCompanies()
      .then((data: string[]) => setCompanies(data))
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  }, []);

  // --- Slot helpers ---
  const updateSlot = (idx: number, field: keyof TimeSlot, value: string | number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    setSlotsSaved(false);
  };

  const addSlot = () => {
    const newId = `s${Date.now()}`;
    setSlots(prev => [
      ...prev,
      { id: newId, time: "09:00", label: "Новый слот", quadsTotal: 7, quadsBooked: 0 },
    ]);
    setSlotsSaved(false);
  };

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
    setSlotsSaved(false);
  };

  const saveSlots = async () => {
    setSlotsSaving(true);
    const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
    try {
      await api.saveSlots(sorted.map(s => ({
        id: s.id,
        time: s.time,
        label: s.label,
        quadsTotal: s.quadsTotal,
      })));
      setSlots(sorted);
      setSlotsSaved(true);
      setTimeout(() => setSlotsSaved(false), 2500);
    } catch {
      alert("Не удалось сохранить слоты");
    } finally {
      setSlotsSaving(false);
    }
  };

  // --- Password ---
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 4) {
      setPwMsg({ text: "Новый пароль слишком короткий", ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: "Пароли не совпадают", ok: false });
      return;
    }
    setPwLoading(true);
    try {
      // Verify current password first
      await api.auth(currentPw);
    } catch {
      setPwMsg({ text: "Текущий пароль неверный", ok: false });
      setPwLoading(false);
      return;
    }
    try {
      await api.changePassword(newPw);
      localStorage.setItem("quad_admin_token", newPw);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg({ text: "Пароль успешно изменён", ok: true });
      setTimeout(() => setPwMsg(null), 3000);
    } catch {
      setPwMsg({ text: "Не удалось изменить пароль", ok: false });
    } finally {
      setPwLoading(false);
    }
  };

  // --- Companies ---
  const addCompany = () => {
    const name = newCompany.trim();
    if (!name || companies.includes(name)) return;
    setCompanies(prev => [...prev, name]);
    setNewCompany("");
    setCompaniesSaved(false);
  };

  const removeCompany = (idx: number) => {
    setCompanies(prev => prev.filter((_, i) => i !== idx));
    setCompaniesSaved(false);
  };

  const handleSaveCompanies = async () => {
    setCompaniesSaving(true);
    try {
      await api.saveCompanies(companies);
      setCompaniesSaved(true);
      setTimeout(() => setCompaniesSaved(false), 2500);
    } catch {
      alert("Не удалось сохранить список компаний");
    } finally {
      setCompaniesSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">

      {/* === Временные слоты === */}
      <div className={sectionCls}>
        <h3 className="font-display text-sm tracking-widest text-fire mb-1 flex items-center gap-2">
          <Icon name="Clock" size={14} />
          ВРЕМЕННЫЕ СЛОТЫ
        </h3>
        <p className="text-xs text-muted-foreground mb-5">Управление расписанием экскурсий</p>

        {slotsLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {slots.map((slot, idx) => (
                <div key={slot.id} className="bg-background border border-border rounded-sm p-3">
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center">
                    <div className="flex items-center justify-center w-6 h-6 bg-fire/10 border border-fire/20 rounded-sm text-xs font-display text-fire font-bold">
                      {idx + 1}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-display text-xs tracking-wider text-muted-foreground/60 block mb-1">ВРЕМЯ</label>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={e => updateSlot(idx, "time", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="font-display text-xs tracking-wider text-muted-foreground/60 block mb-1">НАЗВАНИЕ</label>
                        <input
                          type="text"
                          value={slot.label}
                          onChange={e => updateSlot(idx, "label", e.target.value)}
                          placeholder="Название слота"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="font-display text-xs tracking-wider text-muted-foreground/60 block mb-1">КВАДРЫ</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={slot.quadsTotal}
                          onChange={e => updateSlot(idx, "quadsTotal", Number(e.target.value))}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeSlot(idx)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-red-500 transition-colors rounded-sm hover:bg-red-50"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={addSlot}
                className="flex items-center gap-1.5 border border-dashed border-border hover:border-fire/50 hover:text-fire text-muted-foreground px-4 py-2 text-xs font-display tracking-wider rounded-sm transition-all"
              >
                <Icon name="Plus" size={12} />
                ДОБАВИТЬ СЛОТ
              </button>
              <button
                onClick={saveSlots}
                disabled={slotsSaving}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-display tracking-wider rounded-sm transition-all disabled:opacity-50 ${
                  slotsSaved
                    ? "bg-fire border border-fire text-white"
                    : "bg-fire hover:bg-fire/85 text-white"
                }`}
              >
                <Icon name={slotsSaved ? "Check" : "Save"} size={12} />
                {slotsSaving ? "СОХРАНЕНИЕ..." : slotsSaved ? "СОХРАНЕНО!" : "СОХРАНИТЬ СЛОТЫ"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* === Компании агентов === */}
      <div className={sectionCls}>
        <h3 className="font-display text-sm tracking-widest text-gold mb-1 flex items-center gap-2">
          <Icon name="Briefcase" size={14} />
          КОМПАНИИ АГЕНТОВ
        </h3>
        <p className="text-xs text-muted-foreground mb-5">Агенты смогут выбрать компанию из списка при бронировании</p>

        {companiesLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {companies.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic py-2">Список пуст — агенты будут вводить название вручную</p>
              )}
              {companies.map((company, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background border border-border rounded-sm px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold/60" />
                    <span className="text-sm">{company}</span>
                  </div>
                  <button
                    onClick={() => removeCompany(idx)}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-500 transition-colors"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCompany())}
                placeholder="Название турагентства..."
                className={`flex-1 ${inputCls}`}
              />
              <button
                onClick={addCompany}
                className="flex items-center gap-1.5 border border-border hover:border-gold/50 hover:text-gold px-4 py-2 text-xs font-display tracking-wider rounded-sm transition-all"
              >
                <Icon name="Plus" size={12} />
                ДОБАВИТЬ
              </button>
            </div>

            <button
              onClick={handleSaveCompanies}
              disabled={companiesSaving}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-display tracking-wider rounded-sm transition-all disabled:opacity-50 ${
                companiesSaved
                  ? "bg-fire border border-fire text-white"
                  : "bg-fire hover:bg-fire/85 text-white"
              }`}
            >
              <Icon name={companiesSaved ? "Check" : "Save"} size={12} />
              {companiesSaving ? "СОХРАНЕНИЕ..." : companiesSaved ? "СОХРАНЕНО!" : "СОХРАНИТЬ СПИСОК"}
            </button>
          </>
        )}
      </div>

      {/* === Пароль === */}
      <div className={sectionCls}>
        <h3 className="font-display text-sm tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
          <Icon name="Lock" size={14} />
          СМЕНА ПАРОЛЯ
        </h3>
        <p className="text-xs text-muted-foreground mb-5">Пароль для входа в панель администратора</p>

        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label className={labelCls}>ТЕКУЩИЙ ПАРОЛЬ</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="Введите текущий пароль" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>НОВЫЙ ПАРОЛЬ</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Минимум 4 символа" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Повторите пароль" className={inputCls} />
          </div>

          {pwMsg && (
            <p className={`text-xs font-display tracking-wider ${pwMsg.ok ? "text-fire" : "text-red-500"}`}>
              {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-1.5 bg-fire hover:bg-fire/85 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-display tracking-wider rounded-sm transition-all"
          >
            <Icon name="Lock" size={12} />
            {pwLoading ? "ПРОВЕРКА..." : "ИЗМЕНИТЬ ПАРОЛЬ"}
          </button>
        </form>
      </div>

    </div>
  );
}
