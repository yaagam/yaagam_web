import type {
  AuthProvider,
  BookingStatus,
  BookingType,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import type { GetAdminBookingsQueryDto } from '../dtos/get-admin-bookings-query.dto';
import type { GetAdminUsersQueryDto } from '../dtos/get-admin-users-query.dto';

export interface AdminUserItem {
  id: string;
  whatsappNumber: string | null;
  isWhatsappVerified: boolean;
  provider: AuthProvider | null;
  role: UserRole;
  bookingsCount: number;
  addressesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBookingItem {
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
  amount: {
    base: number;
    discount: number;
    final: number;
    currency: 'INR';
  };
  latestPaymentStatus: PaymentStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];
  meta: AdminPaginationMeta;
}

export interface PaginatedAdminBookings {
  items: AdminBookingItem[];
  meta: AdminPaginationMeta;
}

export interface AdminPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IAdminService {
  getUsers(query: GetAdminUsersQueryDto): Promise<PaginatedAdminUsers>;
  getBookings(query: GetAdminBookingsQueryDto): Promise<PaginatedAdminBookings>;
}
