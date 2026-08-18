import type { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import type { GetOpsSubscriptionsQueryDto } from './get-ops-subscriptions-query.dto';

export interface OpsSubscriptionItem {
  id: string;
  reference: string;
  providerSubscriptionId: string | null;
  status: SubscriptionStatus;
  providerStatus: string | null;
  providerStatusCheckedAt: Date | null;
  autopayMandateStatus: string;
  customer: {
    id: string;
    whatsappNumber: string | null;
  };
  booking: {
    id: string;
    bookingNumber: string;
  };
  pooja: {
    id: string;
    name: string;
  };
  temple: {
    id: string;
    name: string;
  };
  amount: number;
  currency: string;
  paidCount: number;
  totalCount: number | null;
  bookingsCount: number;
  nextChargeAt: Date | null;
  latestPayment: {
    status: PaymentStatus;
    amount: number;
    capturedAt: Date | null;
    providerPaymentId: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  endedAt: Date | null;
}

export interface PaginatedOpsSubscriptions {
  items: OpsSubscriptionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IOpsSubscriptionsService {
  getSubscriptions(
    query: GetOpsSubscriptionsQueryDto,
  ): Promise<PaginatedOpsSubscriptions>;
  getSubscription(id: string): Promise<OpsSubscriptionItem>;
  changeSubscription(
    id: string,
    action: 'pause' | 'resume' | 'cancel',
  ): Promise<OpsSubscriptionItem>;
}
