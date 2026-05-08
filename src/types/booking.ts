export type SlotStatus = "available" | "few" | "busy";

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  quadsTotal: number;
  quadsBooked: number;
}

export interface Booking {
  id: string;
  date: string;
  slotId: string;
  slotTime: string;
  quadsCount: number;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  agentName: string;
  agentPhone: string;
  agentCompany: string;
  prepayment: number | null;
  status: "active" | "cancelled" | "transferred";
  createdAt: string;
  transferredTo?: string;
}

export interface BookingFormData {
  guestName: string;
  guestPhone: string;
  guestAddress: string;
  agentName: string;
  agentPhone: string;
  agentCompany: string;
  prepayment: string;
  customPrepayment: string;
}
