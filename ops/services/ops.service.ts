import { AxiosError } from "axios";
import { apiClient } from "@/services/api-client";
import type { PaginatedResponse } from "@/types/api";
import type { Benefit, Booking, BookingStatus, Pooja, PoojaDetails, Temple, TempleDetails, Translation } from "@/types/ops";

type RawPaginatedResponse<T> = {
  items: T[];
  meta: PaginatedResponse<T>["meta"];
};

type RawBooking = {
  id: string;
  bookingNumber?: string;
  customerName?: string;
  customerPhone?: string;
  templeName?: string;
  poojaName?: string;
  bookingWhatsappNumber?: string;
  user?: { whatsappNumber?: string | null } | null;
  temple?: { name?: string } | null;
  pooja?: { name?: string } | null;
  bookingDate?: string;
  poojaDate?: string;
  amount?: number | { final?: number; base?: number };
  status: BookingStatus;
  createdAt?: string;
};

type RawTemple = {
  id: string;
  email?: string;
  name?: string;
  city?: string;
  state?: string;
  description?: string;
  status?: Temple["status"];
  imageUrl?: string | null;
  createdAt?: string;
  translations?: Translation[];
  _count?: { poojas?: number; bookings?: number };
};

type RawPooja = {
  id: string;
  templeId?: string;
  name?: string;
  templeName?: string;
  price?: number;
  baseAmount?: number | string;
  poojaDay?: string;
  time?: string;
  isWeekly?: boolean;
  weeklyDiscount?: number | null;
  normalDiscount?: number | null;
  status?: Pooja["status"];
  createdAt?: string;
  translations?: Translation[];
  temple?: { id?: string; translations?: Translation[] } | null;
  benefits?: { id: string; translations?: Translation[] }[];
  imageUrls?: string[];
  _count?: { bookings?: number };
};

type RawBenefit = {
  id: string;
  translations?: Translation[];
};

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

function pickTranslation(translations?: Translation[]) {
  return translations?.find((translation) => translation.language === "EN") ?? translations?.[0];
}

function normalizeBooking(booking: RawBooking): Booking {
  const amount = typeof booking.amount === "number" ? booking.amount : booking.amount?.final ?? booking.amount?.base ?? 0;

  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber ?? booking.id,
    customerName: booking.customerName ?? booking.user?.whatsappNumber ?? booking.bookingWhatsappNumber ?? "-",
    customerPhone: booking.customerPhone ?? booking.bookingWhatsappNumber ?? booking.user?.whatsappNumber ?? "-",
    templeName: booking.templeName ?? booking.temple?.name ?? "-",
    poojaName: booking.poojaName ?? booking.pooja?.name ?? "-",
    bookingDate: booking.bookingDate ?? booking.poojaDate ?? booking.createdAt ?? "",
    amount,
    status: booking.status,
    createdAt: booking.createdAt ?? ""
  };
}

function normalizeTemple(temple: RawTemple): Temple {
  const translation = pickTranslation(temple.translations);

  return {
    id: temple.id,
    name: temple.name ?? translation?.name ?? "-",
    city: temple.city ?? translation?.place ?? translation?.district ?? "-",
    state: temple.state ?? "-",
    status: temple.status ?? "ACTIVE",
    imageUrl: temple.imageUrl ?? undefined,
    createdAt: temple.createdAt ?? ""
  };
}

function normalizeTempleDetails(temple: RawTemple): TempleDetails {
  return {
    ...normalizeTemple(temple),
    email: temple.email ?? "",
    description: temple.description ?? "",
    translations: temple.translations ?? [],
    counts: temple._count
      ? {
          poojas: temple._count.poojas ?? 0,
          bookings: temple._count.bookings ?? 0
        }
      : undefined
  };
}

function normalizePooja(pooja: RawPooja): Pooja {
  const translation = pickTranslation(pooja.translations);
  const templeTranslation = pickTranslation(pooja.temple?.translations);
  const price = typeof pooja.baseAmount === "string" ? Number(pooja.baseAmount) : pooja.baseAmount;

  return {
    id: pooja.id,
    name: pooja.name ?? translation?.name ?? "-",
    templeName: pooja.templeName ?? templeTranslation?.name ?? "-",
    price: pooja.price ?? price ?? 0,
    isWeekly: Boolean(pooja.isWeekly),
    status: pooja.status ?? "ACTIVE",
    createdAt: pooja.createdAt ?? ""
  };
}

function normalizePoojaDetails(pooja: RawPooja): PoojaDetails {
  return {
    ...normalizePooja(pooja),
    templeId: pooja.templeId ?? pooja.temple?.id ?? "",
    poojaDay: pooja.poojaDay ?? "",
    time: pooja.time ?? "00:00",
    weeklyDiscount: pooja.weeklyDiscount ?? 0,
    normalDiscount: pooja.normalDiscount ?? 0,
    translations: pooja.translations ?? [],
    benefitIds: pooja.benefits?.map((benefit) => benefit.id) ?? [],
    imageUrls: pooja.imageUrls ?? [],
    counts: pooja._count ? { bookings: pooja._count.bookings ?? 0 } : undefined
  };
}

function normalizeBenefit(benefit: RawBenefit): Benefit {
  return {
    id: benefit.id,
    name: pickTranslation(benefit.translations)?.name ?? benefit.id
  };
}

function normalizePaginated<TInput, TOutput>(response: RawPaginatedResponse<TInput>, normalize: (item: TInput) => TOutput): PaginatedResponse<TOutput> {
  return {
    items: response.items.map(normalize),
    meta: response.meta
  };
}

export type TranslationPayload = Record<string, unknown>;

export type GeneratedTranslations<T extends TranslationPayload> = {
  ML?: T;
  HI?: T;
  MR?: T;
  TA?: T;
};

export async function generateTranslations<T extends TranslationPayload>(data: T) {
  try {
    const { data: result } = await apiClient.post<{
      malayalam?: T;
      hindi?: T;
      marathi?: T;
      tamil?: T;
    }>("/translations", { data, sourceLanguage: "en" });

    return {
      ML: result.malayalam,
      HI: result.hindi,
      MR: result.marathi,
      TA: result.tamil
    } satisfies GeneratedTranslations<T>;
  } catch (error) {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as { message?: string | string[] } | undefined;
      const message = Array.isArray(responseData?.message) ? responseData.message.join(" ") : responseData?.message;
      throw new Error(message || `Translation request failed with status ${error.response?.status ?? "unknown"}.`);
    }

    throw error;
  }
}
export async function getDashboardSummary() {
  const { data } = await apiClient.get("/dashboard/summary");
  return data as {
    users: number;
    bookings: number;
    temples: number;
    poojas: number;
    openSupportTickets: number;
  };
}

export async function getBookings(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawBooking>>("/bookings", { params });
  return normalizePaginated(data, normalizeBooking);
}

export async function getBooking(id: string) {
  const { data } = await apiClient.get<RawBooking>(`/bookings/${id}`);
  return normalizeBooking(data);
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data } = await apiClient.patch<RawBooking>(`/bookings/${id}/status`, { status });
  return normalizeBooking(data);
}

export async function getTemples(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawTemple>>("/temples", { params });
  return normalizePaginated(data, normalizeTemple);
}

export async function getTemple(id: string) {
  const { data } = await apiClient.get<RawTemple>(`/temples/${id}`);
  return normalizeTempleDetails(data);
}

export async function upsertTemple(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawTemple>(`/temples/${id}`, payload, { headers: { "Content-Type": "multipart/form-data" } })
    : await apiClient.post<RawTemple>("/temples", payload, { headers: { "Content-Type": "multipart/form-data" } });
  return normalizeTempleDetails(data);
}

export async function deleteTemple(id: string) {
  const { data } = await apiClient.delete<RawTemple>(`/temples/${id}`);
  return normalizeTempleDetails(data);
}

export async function getPoojas(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawPooja>>("/poojas", { params });
  return normalizePaginated(data, normalizePooja);
}

export async function getPooja(id: string) {
  const { data } = await apiClient.get<RawPooja>(`/poojas/${id}`);
  return normalizePoojaDetails(data);
}

export async function upsertPooja(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawPooja>(`/poojas/${id}`, payload, { headers: { "Content-Type": "multipart/form-data" } })
    : await apiClient.post<RawPooja>("/poojas", payload, { headers: { "Content-Type": "multipart/form-data" } });
  return normalizePoojaDetails(data);
}

export async function deletePooja(id: string) {
  const { data } = await apiClient.delete<RawPooja>(`/poojas/${id}`);
  return normalizePoojaDetails(data);
}

export async function getBenefits(params: ListParams = { page: 1, limit: 100 }) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawBenefit>>("/../benifits", { params });
  return normalizePaginated(data, normalizeBenefit);
}