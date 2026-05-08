import { Booking, TimeSlot } from "@/types/booking";

// --- Defaults ---
const DEFAULT_SLOTS: TimeSlot[] = [
  { id: "s1", time: "08:00", label: "Утренний рейд", quadsTotal: 7, quadsBooked: 0 },
  { id: "s2", time: "10:00", label: "Дневной старт", quadsTotal: 7, quadsBooked: 0 },
  { id: "s3", time: "12:00", label: "Полуденный тур", quadsTotal: 7, quadsBooked: 0 },
  { id: "s4", time: "14:00", label: "Послеобеденный", quadsTotal: 7, quadsBooked: 0 },
  { id: "s5", time: "16:00", label: "Закатный рейд", quadsTotal: 7, quadsBooked: 0 },
  { id: "s6", time: "18:00", label: "Вечерний заезд", quadsTotal: 7, quadsBooked: 0 },
];

const DEFAULT_PASSWORD = "admin2024";
const DEFAULT_COMPANIES: string[] = [];

// --- Storage keys ---
const STORAGE_BOOKINGS = "quad_bookings";
const STORAGE_SLOTS    = "quad_slots";
const STORAGE_PASSWORD = "quad_password";
const STORAGE_COMPANIES = "quad_companies";

// --- Slots ---
export function getTimeSlots(): TimeSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_SLOTS);
    return raw ? JSON.parse(raw) : DEFAULT_SLOTS;
  } catch {
    return DEFAULT_SLOTS;
  }
}

export function saveTimeSlots(slots: TimeSlot[]): void {
  localStorage.setItem(STORAGE_SLOTS, JSON.stringify(slots));
}

// For backward compat — use dynamic getter everywhere
export const TIME_SLOTS = DEFAULT_SLOTS;

// --- Password ---
export function getAdminPassword(): string {
  return localStorage.getItem(STORAGE_PASSWORD) || DEFAULT_PASSWORD;
}

export function saveAdminPassword(pw: string): void {
  localStorage.setItem(STORAGE_PASSWORD, pw);
}

export const ADMIN_PASSWORD = DEFAULT_PASSWORD;

// --- Companies ---
export function getCompanies(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMPANIES);
    return raw ? JSON.parse(raw) : DEFAULT_COMPANIES;
  } catch {
    return DEFAULT_COMPANIES;
  }
}

export function saveCompanies(companies: string[]): void {
  localStorage.setItem(STORAGE_COMPANIES, JSON.stringify(companies));
}

// --- Bookings ---
export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS);
    if (raw) return JSON.parse(raw);
    const sample = getSampleBookings();
    saveBookings(sample);
    return sample;
  } catch {
    return getSampleBookings();
  }
}

export function saveBookings(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(bookings));
}

export function addBooking(booking: Booking): void {
  const all = getBookings();
  all.push(booking);
  saveBookings(all);
}

export function updateBooking(id: string, patch: Partial<Booking>): void {
  const all = getBookings();
  const idx = all.findIndex(b => b.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...patch };
    saveBookings(all);
  }
}

export function getSlotBookedCount(date: string, slotId: string): number {
  return getBookings()
    .filter(b => b.date === date && b.slotId === slotId && b.status === "active")
    .reduce((sum, b) => sum + b.quadsCount, 0);
}

export function getSlotFreeCount(date: string, slotId: string): number {
  const slots = getTimeSlots();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return 0;
  return slot.quadsTotal - getSlotBookedCount(date, slotId);
}

export function isDayFull(date: string): boolean {
  return getTimeSlots().every(slot => getSlotFreeCount(date, slot.id) === 0);
}

export function getDayFreeTotal(date: string): number {
  return getTimeSlots().reduce((sum, slot) => sum + getSlotFreeCount(date, slot.id), 0);
}

export function getSlotsWithAvailability(date: string, excludeBookingId?: string) {
  const bookings = getBookings();
  return getTimeSlots().map(slot => {
    const booked = bookings
      .filter(b =>
        b.date === date &&
        b.slotId === slot.id &&
        b.status === "active" &&
        b.id !== excludeBookingId
      )
      .reduce((sum, b) => sum + b.quadsCount, 0);
    const free = slot.quadsTotal - booked;
    return { ...slot, booked, free };
  });
}

function getSampleBookings(): Booking[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const t1 = new Date(today); t1.setDate(today.getDate() + 1);
  const t2 = new Date(today); t2.setDate(today.getDate() + 2);

  return [
    {
      id: "b1",
      date: fmt(t1),
      slotId: "s1",
      slotTime: "08:00",
      quadsCount: 3,
      guestName: "Иванов Михаил",
      guestPhone: "+7 900 111-22-33",
      guestAddress: "ул. Ленина, 12, отель Приморский",
      agentName: "Светлана Агентова",
      agentPhone: "+7 900 555-66-77",
      agentCompany: "ТурАгент Сочи",
      prepayment: 5000,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b2",
      date: fmt(t1),
      slotId: "s3",
      slotTime: "12:00",
      quadsCount: 2,
      guestName: "Петрова Анна",
      guestPhone: "+7 900 222-33-44",
      guestAddress: "Курортный пр-т 14, санаторий Салют",
      agentName: "Дмитрий Продавцов",
      agentPhone: "+7 900 444-55-66",
      agentCompany: "ВинТур",
      prepayment: null,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b3",
      date: fmt(t2),
      slotId: "s2",
      slotTime: "10:00",
      quadsCount: 5,
      guestName: "Сидоров Алексей",
      guestPhone: "+7 900 333-44-55",
      guestAddress: "Набережная, 8, гостиница Море",
      agentName: "Марина Гидова",
      agentPhone: "+7 900 777-88-99",
      agentCompany: "АдвенчерТур",
      prepayment: 3000,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];
}
