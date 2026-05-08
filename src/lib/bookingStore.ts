import { Booking, TimeSlot } from "@/types/booking";

export const ADMIN_PASSWORD = "admin2024";

export const TIME_SLOTS: TimeSlot[] = [
  { id: "s1", time: "08:00", label: "Утренний рейд", quadsTotal: 7, quadsBooked: 0 },
  { id: "s2", time: "10:00", label: "Дневной старт", quadsTotal: 7, quadsBooked: 0 },
  { id: "s3", time: "12:00", label: "Полуденный тур", quadsTotal: 7, quadsBooked: 0 },
  { id: "s4", time: "14:00", label: "Послеобеденный", quadsTotal: 7, quadsBooked: 0 },
  { id: "s5", time: "16:00", label: "Закатный рейд", quadsTotal: 7, quadsBooked: 0 },
  { id: "s6", time: "18:00", label: "Вечерний заезд", quadsTotal: 7, quadsBooked: 0 },
];

const STORAGE_KEY = "quad_bookings";

export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getSampleBookings();
  } catch {
    return getSampleBookings();
  }
}

export function saveBookings(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
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
