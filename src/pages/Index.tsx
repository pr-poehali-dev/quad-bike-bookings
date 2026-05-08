import { useState } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/ff99e67c-206b-434b-a8cd-0f0f14c676c8/files/a4ade244-1fa7-4adf-ab4e-4383e5d3d275.jpg";

const TOURS = [
  {
    id: 1,
    name: "Горный прорыв",
    duration: "3 часа",
    difficulty: "СРЕДНИЙ",
    price: "3 500",
    distance: "25 км",
    description: "Серпантины горных троп, живописные перевалы и незабываемые панорамы",
    color: "#FF5500",
    spots: 4,
    maxSpots: 6,
  },
  {
    id: 2,
    name: "Степной ураган",
    duration: "5 часов",
    difficulty: "ЛЁГКИЙ",
    price: "4 800",
    distance: "45 км",
    description: "Бескрайние степи, пыльные вихри и полная свобода скорости",
    color: "#FFB800",
    spots: 2,
    maxSpots: 8,
  },
  {
    id: 3,
    name: "Ночной рейд",
    duration: "4 часа",
    difficulty: "ХАРДКОР",
    price: "6 200",
    distance: "30 км",
    description: "Ночные трассы под звёздами — экстрим для настоящих искателей приключений",
    color: "#FF2200",
    spots: 0,
    maxSpots: 4,
  },
];

const AGENTS = [
  {
    id: 1,
    name: "Алексей Громов",
    role: "Старший инструктор",
    experience: "8 лет",
    tours: 340,
    rating: 4.9,
    speciality: "Горные маршруты",
    initials: "АГ",
    color: "#FF5500",
  },
  {
    id: 2,
    name: "Марина Степная",
    role: "Инструктор-гид",
    experience: "5 лет",
    tours: 210,
    rating: 4.8,
    speciality: "Степные маршруты",
    initials: "МС",
    color: "#FFB800",
  },
  {
    id: 3,
    name: "Дмитрий Вихрев",
    role: "Технический эксперт",
    experience: "10 лет",
    tours: 520,
    rating: 5.0,
    speciality: "Экстремальные туры",
    initials: "ДВ",
    color: "#FF3300",
  },
];

const NAV_ITEMS = [
  { label: "Туры", section: "tours" },
  { label: "Агенты", section: "agents" },
  { label: "Бронирование", section: "booking" },
];

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_OF_WEEK = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const BOOKED_DATES: Record<string, "available" | "busy" | "few"> = {
  "2026-05-10": "few",
  "2026-05-12": "busy",
  "2026-05-15": "available",
  "2026-05-17": "few",
  "2026-05-20": "busy",
  "2026-05-22": "available",
  "2026-05-25": "available",
  "2026-05-28": "few",
  "2026-06-03": "available",
  "2026-06-07": "few",
  "2026-06-10": "busy",
  "2026-06-14": "available",
  "2026-06-18": "available",
};

function Calendar({ onSelectDate }: { onSelectDate: (date: string) => void }) {
  const today = new Date(2026, 4, 8);
  const [viewDate, setViewDate] = useState({ year: 2026, month: 4 });
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    if (viewDate.month === 0) setViewDate({ year: viewDate.year - 1, month: 11 });
    else setViewDate({ ...viewDate, month: viewDate.month - 1 });
  };
  const nextMonth = () => {
    if (viewDate.month === 11) setViewDate({ year: viewDate.year + 1, month: 0 });
    else setViewDate({ ...viewDate, month: viewDate.month + 1 });
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-surface rounded-sm p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>
        <span className="font-display text-lg tracking-wider">
          {MONTHS[viewDate.month]} {viewDate.year}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors">
          <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-display tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = BOOKED_DATES[dateStr];
          const isPast = new Date(viewDate.year, viewDate.month, day) < today;
          const isSelected = selected === dateStr;

          let cellClass = "aspect-square flex items-center justify-center text-sm rounded cursor-pointer transition-all font-body ";
          if (isPast) {
            cellClass += "text-muted-foreground/30 cursor-not-allowed";
          } else if (isSelected) {
            cellClass += "bg-fire text-white font-semibold scale-110";
          } else if (status === "busy") {
            cellClass += "bg-red-900/30 text-red-400 cursor-not-allowed line-through";
          } else if (status === "few") {
            cellClass += "bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30";
          } else if (status === "available") {
            cellClass += "bg-green-900/30 text-green-400 border border-green-700/40 hover:bg-green-800/40";
          } else {
            cellClass += "hover:bg-white/8 text-foreground/70";
          }

          return (
            <button
              key={dateStr}
              className={cellClass}
              disabled={isPast || status === "busy"}
              onClick={() => {
                if (!isPast && status !== "busy") {
                  setSelected(dateStr);
                  onSelectDate(dateStr);
                }
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-900/50 border border-green-700/40" />
          <span className="text-muted-foreground">Свободно</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gold/20 border border-gold/40" />
          <span className="text-muted-foreground">Мало мест</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-900/30" />
          <span className="text-muted-foreground">Занято</span>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [activeSection, setActiveSection] = useState("tours");
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", guests: "1" });
  const [submitted, setSubmitted] = useState(false);

  const scrollTo = (section: string) => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectedTourData = TOURS.find(t => t.id === selectedTour);

  return (
    <div className="min-h-screen bg-background diagonal-lines">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fire rounded-sm flex items-center justify-center animate-pulse-fire">
              <span className="text-white font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display text-xl tracking-widest font-bold">MOTO<span className="text-fire">RUSH</span></span>
          </div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.section}
                onClick={() => scrollTo(item.section)}
                className={`px-4 py-2 text-sm font-display tracking-wider transition-all rounded-sm ${
                  activeSection === item.section
                    ? "bg-fire text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="absolute top-1/3 right-[15%] w-96 h-96 rounded-full bg-fire/10 blur-3xl animate-drift" />
        <div className="absolute bottom-1/4 right-[25%] w-64 h-64 rounded-full bg-gold/8 blur-3xl animate-drift" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-fire/15 border border-fire/30 rounded-sm px-3 py-1.5 mb-8 animate-fade-in stagger-1">
              <div className="w-2 h-2 rounded-full bg-fire animate-pulse" />
              <span className="font-display text-xs tracking-widest text-fire uppercase">Сезон открыт · Бронируй сейчас</span>
            </div>

            <h1 className="font-display text-7xl md:text-8xl font-bold leading-none mb-6 animate-fade-in stagger-2">
              ГОНИ БЕЗ<br />
              <span className="text-fire glow-fire-text">ГРАНИЦ</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg animate-fade-in stagger-3">
              Прокат квадроциклов и экстремальные туры по диким маршрутам.
              Профессиональные инструкторы, современная техника.
            </p>

            <div className="flex gap-4 animate-fade-in stagger-4">
              <button
                onClick={() => scrollTo("tours")}
                className="bg-fire hover:bg-fire/85 text-white font-display tracking-wider px-8 py-4 text-sm clip-arrow transition-all hover:scale-105 glow-fire"
              >
                ВЫБРАТЬ ТУР
              </button>
              <button
                onClick={() => scrollTo("booking")}
                className="border border-border hover:border-fire/50 text-foreground font-display tracking-wider px-8 py-4 text-sm transition-all hover:bg-white/5"
              >
                ЗАБРОНИРОВАТЬ
              </button>
            </div>

            <div className="flex gap-8 mt-14 animate-fade-in stagger-5">
              {[["340+", "туров проведено"], ["98%", "довольных клиентов"], ["8", "маршрутов"]].map(([val, label]) => (
                <div key={label}>
                  <div className="font-display text-3xl font-bold text-fire">{val}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOURS */}
      <section id="tours" className="py-24 max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <span className="font-display text-xs tracking-widest text-fire uppercase block mb-3">/ маршруты</span>
            <h2 className="font-display text-5xl font-bold">НАШИ ТУРЫ</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Обновлено только что</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOURS.map((tour, idx) => {
            const availability = tour.spots === 0 ? "Мест нет" : tour.spots <= 2 ? `Осталось ${tour.spots} места` : `${tour.spots} из ${tour.maxSpots} мест`;
            const availColor = tour.spots === 0 ? "text-red-400" : tour.spots <= 2 ? "text-gold" : "text-green-400";
            const isSelected = selectedTour === tour.id;

            return (
              <div
                key={tour.id}
                className={`group relative bg-surface border rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 animate-fade-in ${
                  isSelected ? "border-fire shadow-lg shadow-fire/20" : "border-border hover:border-white/20"
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setSelectedTour(isSelected ? null : tour.id)}
              >
                <div className="h-1 w-full" style={{ backgroundColor: tour.color }} />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="inline-block font-display text-xs tracking-widest px-2 py-0.5 rounded-sm mb-2"
                        style={{ backgroundColor: `${tour.color}20`, color: tour.color }}>
                        {tour.difficulty}
                      </div>
                      <h3 className="font-display text-2xl font-bold">{tour.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-fire">{tour.price}₽</div>
                      <div className="text-xs text-muted-foreground">с человека</div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{tour.description}</p>

                  <div className="flex gap-4 mb-5 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon name="Clock" size={14} />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon name="MapPin" size={14} />
                      <span>{tour.distance}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${tour.spots === 0 ? 'bg-red-500' : tour.spots <= 2 ? 'bg-gold animate-pulse' : 'bg-green-500'}`} />
                      <span className={`text-xs font-display tracking-wider ${availColor}`}>{availability}</span>
                    </div>
                    <button
                      className={`font-display text-xs tracking-wider px-4 py-2 rounded-sm transition-all ${
                        tour.spots === 0
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : isSelected
                          ? "bg-fire text-white"
                          : "border border-border hover:border-fire/50 hover:text-fire"
                      }`}
                      disabled={tour.spots === 0}
                      onClick={(e) => { e.stopPropagation(); if (tour.spots > 0) { setSelectedTour(tour.id); scrollTo("booking"); }}}
                    >
                      {tour.spots === 0 ? "ЗАНЯТО" : isSelected ? "ВЫБРАН ✓" : "ВЫБРАТЬ"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="py-24 bg-surface/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="font-display text-xs tracking-widest text-fire uppercase block mb-3">/ команда</span>
            <h2 className="font-display text-5xl font-bold">НАШИ АГЕНТЫ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AGENTS.map((agent, idx) => (
              <div
                key={agent.id}
                className="group bg-background border border-border hover:border-white/20 rounded-sm p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-sm flex items-center justify-center font-display font-bold text-xl text-white flex-shrink-0"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.initials}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Специализация</span>
                    <span className="text-xs font-display tracking-wide" style={{ color: agent.color }}>{agent.speciality}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Опыт</span>
                    <span className="text-xs font-semibold">{agent.experience}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Туров проведено</span>
                    <span className="text-xs font-semibold">{agent.tours}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Icon key={s} name="Star" size={12} className={s <= Math.floor(agent.rating) ? "text-gold fill-gold" : "text-muted-foreground"} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{agent.rating}</span>
                  </div>
                  <button
                    className="font-display text-xs tracking-wider px-4 py-1.5 border border-border hover:border-fire/50 hover:text-fire rounded-sm transition-all"
                    onClick={() => scrollTo("booking")}
                  >
                    ВЫБРАТЬ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" className="py-24 max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <span className="font-display text-xs tracking-widest text-fire uppercase block mb-3">/ онлайн-запись</span>
          <h2 className="font-display text-5xl font-bold">БРОНИРОВАНИЕ</h2>
        </div>

        {submitted ? (
          <div className="max-w-lg mx-auto text-center py-20 animate-scale-in">
            <div className="w-16 h-16 bg-fire/15 border border-fire/30 rounded-sm flex items-center justify-center mx-auto mb-6 animate-pulse-fire">
              <Icon name="CheckCircle" size={32} className="text-fire" />
            </div>
            <h3 className="font-display text-3xl font-bold mb-3">ЗАЯВКА ПРИНЯТА!</h3>
            {selectedTourData && (
              <p className="text-muted-foreground mb-2">
                Тур: <span className="text-gold font-semibold">{selectedTourData.name}</span>
              </p>
            )}
            {selectedDate && (
              <p className="text-muted-foreground text-sm mb-6">
                Дата: <span className="text-foreground">{selectedDate}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">Мы свяжемся с вами в ближайшее время для подтверждения</p>
            <button
              onClick={() => { setSubmitted(false); setFormData({ name: "", phone: "", guests: "1" }); }}
              className="mt-8 font-display tracking-wider text-sm border border-border hover:border-fire/50 px-6 py-3 rounded-sm transition-all"
            >
              НОВАЯ ЗАЯВКА
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-lg tracking-wider mb-4 text-muted-foreground">ВЫБЕРИТЕ ДАТУ</h3>
              <Calendar onSelectDate={setSelectedDate} />
              {selectedDate && (
                <div className="mt-3 flex items-center gap-2 text-sm animate-fade-in">
                  <Icon name="Calendar" size={14} className="text-fire" />
                  <span className="text-muted-foreground">Выбрано:</span>
                  <span className="font-display text-fire tracking-wider">{selectedDate}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-display text-lg tracking-wider mb-4 text-muted-foreground">ДЕТАЛИ ЗАЯВКИ</h3>

              {selectedTourData && (
                <div className="bg-surface border border-fire/30 rounded-sm p-4 mb-4 flex items-center justify-between animate-fade-in">
                  <div>
                    <div className="font-display font-bold">{selectedTourData.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selectedTourData.duration} · {selectedTourData.distance}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-fire">{selectedTourData.price}₽</div>
                    <button onClick={() => setSelectedTour(null)} className="text-xs text-muted-foreground hover:text-fire mt-0.5">изменить</button>
                  </div>
                </div>
              )}

              {!selectedTourData && (
                <div className="bg-surface border border-border rounded-sm p-4 mb-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Icon name="Info" size={14} />
                  <span>Выберите тур выше или оставьте заявку без конкретного тура</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-display text-xs tracking-wider text-muted-foreground block mb-2">ИМЯ И ФАМИЛИЯ</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Иван Петров"
                    className="w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-wider text-muted-foreground block mb-2">ТЕЛЕФОН</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-wider text-muted-foreground block mb-2">КОЛИЧЕСТВО ЧЕЛОВЕК</label>
                  <select
                    value={formData.guests}
                    onChange={e => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full bg-surface border border-border focus:border-fire/60 rounded-sm px-4 py-3 text-sm outline-none transition-colors"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? "человек" : n < 5 ? "человека" : "человек"}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-fire hover:bg-fire/85 text-white font-display tracking-widest py-4 text-sm transition-all mt-2"
                >
                  ОТПРАВИТЬ ЗАЯВКУ →
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-fire rounded-sm flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display text-sm tracking-widest">MOTO<span className="text-fire">RUSH</span></span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground font-display tracking-wider">
            {NAV_ITEMS.map(item => (
              <button key={item.section} onClick={() => scrollTo(item.section)} className="hover:text-fire transition-colors">
                {item.label.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Онлайн · Принимаем заявки</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
