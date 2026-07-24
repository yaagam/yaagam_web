import type { EntityStatus } from "@/types/api";

export type Language = "EN" | "ML" | "HI" | "MR" | "TA";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type Translation = {
  id?: string;
  language: Language;
  name: string;
  district?: string;
  place?: string;
  description?: string;
  about?: string;
};

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

export type TempleDetails = Temple & {
  email: string;
  description: string;
  translations: Translation[];
  counts?: {
    poojas: number;
    bookings: number;
  };
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

export type PoojaDetails = Pooja & {
  templeId: string;
  poojaDay: string;
  time: string;
  weeklyDiscount: number;
  normalDiscount: number;
  translations: Translation[];
  benefitIds: string[];
  imageUrls: string[];
  counts?: {
    bookings: number;
  };
};

export type Benefit = {
  id: string;
  name: string;
};