import instance from "@/lib/api/axios/axios.instance";

export type AdminUserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type AuthProvider = "GOOGLE" | "FACEBOOK" | "WHATSAPP";
export type BookingType = "WEEKLY" | "SINGLE";
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminUserItem = {
  id: string;
  whatsappNumber: string | null;
  isWhatsappVerified: boolean;
  provider: AuthProvider | null;
  role: AdminUserRole;
  bookingsCount: number;
  devoteesCount: number;
  addressesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminBookingItem = {
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
  bookingDate: string;
  amount: {
    base: number;
    discount: number;
    final: number;
    currency: "INR";
  };
  latestPaymentStatus: PaymentStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedAdminUsers = {
  items: AdminUserItem[];
  meta: AdminPaginationMeta;
};

export type PaginatedAdminBookings = {
  items: AdminBookingItem[];
  meta: AdminPaginationMeta;
};

export type GetAdminUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminUserRole | "";
  provider?: AuthProvider | "";
  isWhatsappVerified?: boolean | "";
};

export type GetAdminBookingsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus | "";
  type?: BookingType | "";
  paymentStatus?: PaymentStatus | "";
  bookingDateFrom?: string;
  bookingDateTo?: string;
};

const emptyMeta: AdminPaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function getResponseData(responseData: unknown) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: unknown }).data;
  }

  return responseData;
}

function normalizePaginated<T>(data: unknown): { items: T[]; meta: AdminPaginationMeta } {
  const payload = getResponseData(data);

  if (!payload || typeof payload !== "object") {
    return { items: [], meta: emptyMeta };
  }

  const response = payload as Partial<{ items: T[]; meta: AdminPaginationMeta }>;

  return {
    items: Array.isArray(response.items) ? response.items : [],
    meta: { ...emptyMeta, ...(response.meta ?? {}) },
  };
}

export async function getAdminUsersApi(params: GetAdminUsersParams = {}) {
  const response = await instance.get("/admin/users", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      role: params.role || undefined,
      provider: params.provider || undefined,
      isWhatsappVerified:
        typeof params.isWhatsappVerified === "boolean"
          ? params.isWhatsappVerified
          : undefined,
    },
  });

  return normalizePaginated<AdminUserItem>(response.data) as PaginatedAdminUsers;
}

export async function getAdminBookingsApi(params: GetAdminBookingsParams = {}) {
  const response = await instance.get("/admin/bookings", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
      paymentStatus: params.paymentStatus || undefined,
      bookingDateFrom: params.bookingDateFrom || undefined,
      bookingDateTo: params.bookingDateTo || undefined,
    },
  });

  return normalizePaginated<AdminBookingItem>(response.data) as PaginatedAdminBookings;
}