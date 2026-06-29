import type { BookingStatus, BookingType } from '@prisma/client';
import type { CreateCheckoutSessionDto } from '../dtos/create-checkout-session.dto';
import type { GetMyPoojasQueryDto } from '../dtos/get-my-poojas-query.dto';

export interface CheckoutSession {
  bookingId: string;
  transactionId: string;
  keyId: string;
  amount: number;
  currency: string;
  gatewayMode: 'order' | 'subscription' | 'autopay-qr';
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  gatewayReference: string;
  prefill: {
    name: string;
    contact: string;
  };
}

export interface MyPoojaItem {
  id: string;
  bookingNumber: string;
  pooja: {
    id: string;
    name: string;
    imageUrls: string[];
  };
  temple: {
    id: string;
    name: string;
  };
  poojaDay: string | null;
  poojaTime: string | null;
  bookingDate: Date;
  type: BookingType;
  displayType: 'Weekly Plan' | 'Single Day';
  status: BookingStatus;
  displayStatus: 'Booked' | 'Scheduled' | 'Processing' | 'Completed';
  amount: {
    base: number;
    discount: number;
    final: number;
    currency: 'INR';
  };
  whatsappNumber: string;
  latestPaymentStatus: string | null;
  completionNote: string | null;
  createdAt: Date;
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
}
