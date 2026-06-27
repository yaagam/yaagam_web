import type {
  BookingStatus,
  BookingType,
  PaymentStatus,
} from "@/lib/api/admin/management/admin-management.api";

export const ADMIN_SEARCH_DEBOUNCE_MS = 350;

export const ADMIN_LARGE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const ADMIN_ENTITY_PAGE_SIZE_OPTIONS = [5, 10, 20];

export const ADMIN_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "CONFIRMED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export const ADMIN_BOOKING_TYPES: BookingType[] = ["SINGLE", "WEEKLY"];

export const ADMIN_PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
];