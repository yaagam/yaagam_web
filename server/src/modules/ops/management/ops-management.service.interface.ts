import type {
  AuthProvider,
  BookingStatus,
  BookingType,
  PaymentStatus,
  SupportStatus,
} from '@prisma/client';
import type { GetOpsSupportTicketsQueryDto } from '../../support/dto/get-ops-support-tickets-query.dto';
import type { UpdateSupportTicketStatusDto } from '../../support/dto/update-support-ticket-status.dto';
import type { SupportTicketEntity } from '../../support/entities/support-ticket.entity';
import type { GetOpsBookingsQueryDto } from '../bookings/get-ops-bookings-query.dto';
import type { GetOpsUsersQueryDto } from '../users/get-ops-users-query.dto';

export interface OpsUserItem {
  id: string;
  whatsappNumber: string | null;
  isWhatsappVerified: boolean;
  provider: AuthProvider | null;
  bookingsCount: number;
  addressesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpsBookingItem {
  id: string;
  bookingNumber: string;
  user: {
    id: string;
    whatsappNumber: string | null;
    isWhatsappVerified: boolean;
  };
  pooja: {
    id: string;
    name: string;
  };
  temple: {
    id: string;
    name: string;
  };
  bookingWhatsappNumber: string;
  type: BookingType;
  status: BookingStatus;
  bookingDate: Date;
  poojaDate: Date;
  amount: {
    base: number;
    discount: number;
    final: number;
    currency: 'INR';
  };
  latestPaymentStatus: PaymentStatus | null;
  zohoSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  zohoSyncError: string | null;
  zohoSalesOrderId: string | null;
  zohoInvoiceId: string | null;
  zohoPaymentId: string | null;
  zohoBillId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedOpsUsers {
  items: OpsUserItem[];
  meta: OpsPaginationMeta;
}

export interface PaginatedOpsBookings {
  items: OpsBookingItem[];
  meta: OpsPaginationMeta;
}

export interface PaginatedOpsSupportTickets {
  items: SupportTicketEntity[];
  meta: OpsPaginationMeta;
}

export interface UpdatedOpsSupportTicketStatus {
  id: string;
  ticketNumber: string;
  status: SupportStatus;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

export interface OpsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IOpsManagementService {
  getUsers(query: GetOpsUsersQueryDto): Promise<PaginatedOpsUsers>;
  getBookings(query: GetOpsBookingsQueryDto): Promise<PaginatedOpsBookings>;
  getBooking(id: string): Promise<OpsBookingItem>;
  retryBookingZohoSync(id: string): Promise<OpsBookingItem>;
  updateBookingStatus(
    id: string,
    status: BookingStatus,
  ): Promise<{ id: string; status: BookingStatus; updatedAt: Date }>;
  getSupportTickets(
    query: GetOpsSupportTicketsQueryDto,
  ): Promise<PaginatedOpsSupportTickets>;
  updateSupportTicketStatus(
    id: string,
    dto: UpdateSupportTicketStatusDto,
    resolvedBy?: string | null,
  ): Promise<UpdatedOpsSupportTicketStatus>;
}
