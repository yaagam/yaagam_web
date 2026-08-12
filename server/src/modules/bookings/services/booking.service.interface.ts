import type { BookingStatus, BookingType } from '@prisma/client';
import type { CreateCheckoutSessionDto } from '../dtos/create-checkout-session.dto';
import type { GetMyPoojasQueryDto } from '../dtos/get-my-poojas-query.dto';

export interface CheckoutSession {
  publicToken: string;
  bookingReference: string;
  transactionReference: string;
  keyId: string;
  amount: number;
  currency: string;
  gatewayMode: 'order' | 'subscription';
  orderId?: string;
  subscriptionId?: string;
  status: 'pending' | 'subscription_pending';
  expiresAt: string;
  serverTime: string;
  redirectUrl?: string;
  gatewayReference: string;
  priceBreakdown: {
    poojaBaseAmount: number;
    poojaUnitAmount: number;
    devoteeCount: number;
    poojaAmount: number;
    offerings: Array<{
      offeringSlug: string;
      nameSnapshot: string;
      quantity: number;
      unitAmount: number;
      total: number;
    }>;
    offeringTotal: number;
    dakshinaAmount: number;
    grandTotal: number;
    recurringWeeklyAmount: number;
    currency: 'INR';
  };
  prefill: {
    name: string;
    contact: string;
    email?: string;
  };
}

export interface MyPoojaItem {
  reference: string;
  bookingNumber: string;
  pooja: {
    slug: string;
    name: string;
    imageUrls: string[];
  };
  temple: {
    slug: string;
    name: string;
  };
  poojaDay: string | null;
  poojaTime: string | null;
  bookingDate: Date;
  poojaDate: Date;
  type: BookingType;
  displayType: 'Weekly Plan' | 'Single Day';
  status: BookingStatus;
  displayStatus:
    | 'Payment Pending'
    | 'Payment Failed'
    | 'Booked'
    | 'Scheduled'
    | 'Completed'
    | 'Cancelled'
    | 'Refunded';
  amount: {
    base: number;
    discount: number;
    final: number;
    currency: 'INR';
  };
  devotees: Array<{
    name: string;
    naal: string;
  }>;
  whatsappNumber: string;
  latestPaymentStatus: string | null;
  completionNote: string | null;
  createdAt: Date;
}

export interface LastBookingDevoteeDetails {
  devotees: Array<{
    name: string;
    naal: string;
  }>;
  whatsappNumber: string;
  state: string;
  address: {
    houseNo: string;
    streetName: string;
    pincode: string;
    district: string;
    state: string;
    phoneNumber: string;
  } | null;
}
export interface PaginatedMyPoojas {
  items: MyPoojaItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IBookingService {
  createCheckoutSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession>;
  getMyPoojas(
    userId: string,
    query: GetMyPoojasQueryDto,
  ): Promise<PaginatedMyPoojas>;
  getLastBookingDevoteeDetails(
    userId: string,
  ): Promise<LastBookingDevoteeDetails | null>;
}
