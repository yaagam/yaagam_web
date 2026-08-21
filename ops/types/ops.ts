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
  poojaFor?: string;
  mantra?: string;
  dos?: string[];
  donts?: string[];
};

export type PoojaTranslation = Translation & {
  imageUrls: string[];
};

export type Booking = {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  userId: string;
  templeId: string;
  templeName: string;
  poojaId: string;
  poojaName: string;
  benefits: { id: string; name: string }[];
  bookingDate: string;
  poojaDate: string;
  amount: number;
  amountDetails: {
    base: number;
    discount: number;
    final: number;
    dakshina: number;
    offeringTotal: number;
    platformFee: number;
    platformFeeGst: number;
    templePayable: number;
    currency: string;
  };
  devotees: { name: string; naal: string }[];
  devoteeState: string | null;
  specialRequest: string | null;
  sankalpa: string | null;
  deliveryAddress: {
    houseNo: string | null;
    streetName: string;
    location: string | null;
    district: string;
    state: string;
    pincode: string;
    phoneNumber: string;
  } | null;
  offerings: {
    id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  type: string;
  latestPaymentStatus: string | null;
  status: BookingStatus;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  zohoSalesOrderId: string | null;
  zohoInvoiceId: string | null;
  zohoPaymentId: string | null;
  zohoBillId: string | null;
  createdAt: string;
  updatedAt: string;
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

export type TemplePriest = {
  name: string;
  experience: string;
};

export type TempleDetails = Temple & {
  email?: string;
  templePriest: TemplePriest;
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
  sellingPrice: number;
  isWeekly: boolean;
  recommendedWeeks: number;
  isActive: boolean;
  createdAt: string;
  zohoItemId: string | null;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  lastZohoSyncAt: string | null;
  mantraChantCount: number | null;
  mantraAudioUrl: string | null;
};

export type PoojaDetails = Pooja & {
  templeId: string;
  poojaDay: string;
  time: string;
  translations: PoojaTranslation[];
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
  poojas: { id: string; name: string }[];
  createdAt: string;
};
export type User = {
  id: string;
  whatsappNumber: string | null;
  isWhatsappVerified: boolean;
  provider: string | null;
  bookingsCount: number;
  addressesCount: number;
  createdAt: string;
  updatedAt: string;
};
export type Offering = {
  id: string;
  name: string;
  description: string;
  templeAmount: number;
  basePrice: number;
  sellingPrice: number;
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

export type SubscriptionStatus =
  | "CREATING"
  | "CREATED"
  | "AUTHENTICATED"
  | "ACTIVE"
  | "PAUSED"
  | "HALTED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED";

export type Subscription = {
  id: string;
  reference: string;
  providerSubscriptionId: string | null;
  status: SubscriptionStatus;
  providerStatus: string | null;
  providerStatusCheckedAt: string | null;
  autopayMandateStatus: string;
  customer: { id: string; whatsappNumber: string | null };
  booking: { id: string; bookingNumber: string };
  pooja: { id: string; name: string };
  temple: { id: string; name: string };
  amount: number;
  currency: string;
  paidCount: number;
  totalCount: number | null;
  bookingsCount: number;
  nextChargeAt: string | null;
  latestPayment: {
    status: string;
    amount: number;
    capturedAt: string | null;
    providerPaymentId: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
};
export type SettlementStatus =
  | "PENDING"
  | "PROCESSING"
  | "PARTIAL"
  | "SETTLED"
  | "FAILED";
export type VendorBillStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
export type SettlementVendorBill = {
  id: string;
  templeId: string;
  amount: number;
  status: VendorBillStatus;
  zohoBillId: string | null;
  errorMessage: string | null;
};
export type Settlement = {
  id: string;
  providerSettlementId: string;
  status: SettlementStatus;
  amount: number;
  fees: number;
  tax: number;
  currency: string;
  utr: string | null;
  providerCreatedAt: string;
  settledAt: string | null;
  lastErrorMessage: string | null;
  paymentCount: number;
  vendorBills: SettlementVendorBill[];
};
