export type Language = "EN" | "ML" | "HI" | "MR" | "TA";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type SupportContactMethod = "WHATSAPP" | "CALL";
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

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

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string | null;
  name: string;
  phoneNumber: string;
  contactMethod: SupportContactMethod;
  problem: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type ZohoSyncStatus = "PENDING" | "SYNCED" | "FAILED";

export type Temple = {
  id: string;
  name: string;
  city: string;
  state: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  zohoVendorId: string | null;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  lastZohoSyncAt: string | null;
};

export type TempleDetails = Temple & {
  email?: string;
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
  templeAmount: number;
  baseAmount: number;
  discountAmount: number;
  isWeekly: boolean;
  isActive: boolean;
  createdAt: string;
  zohoItemId: string | null;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  lastZohoSyncAt: string | null;
};

export type PoojaDetails = Pooja & {
  templeId: string;
  poojaDay: string;
  time: string;
  translations: Translation[];
  benefitIds: string[];
  offeringIds: string[];
  imageUrls: string[];
  counts?: {
    bookings: number;
  };
};

export type Benefit = {
  id: string;
  name: string;
  translations: Translation[];
  poojaCount: number;
  createdAt: string;
};
export type Offering = {
  id: string;
  name: string;
  description: string;
  templeAmount: number;
  actualPrice: number;
  discountPrice: number;
  isActive: boolean;
  imageUrl?: string;
  translations: Translation[];
  poojaCount: number;
  createdAt: string;
  zohoItemId: string | null;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  lastZohoSyncAt: string | null;
};
