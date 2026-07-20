import type { EntityStatus } from "@/types/api";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type Booking = {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  templeName: string;
  poojaName: string;
  bookingDate: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
};

export type Temple = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: EntityStatus;
  imageUrl?: string;
  createdAt: string;
};

export type Pooja = {
  id: string;
  name: string;
  templeName: string;
  price: number;
  isWeekly: boolean;
  status: EntityStatus;
  createdAt: string;
};