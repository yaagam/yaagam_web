import { AxiosError } from "axios";
import { apiClient } from "@/services/api-client";
import type { PaginatedResponse } from "@/types/api";
import type { Benefit, Booking, BookingStatus, Offering, Pooja, PoojaDetails, SupportContactMethod, SupportTicket, SupportTicketStatus, Temple, TempleDetails, Translation } from "@/types/ops";

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

type RawSupportTicket = {
  id: string;
  ticketNumber?: string;
  userId?: string | null;
  name?: string;
  phoneNumber?: string;
  contactMethod?: SupportContactMethod;
  problem?: string;
  status: SupportTicketStatus;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
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
  offerings?: { id: string }[];
  imageUrls?: string[];
  _count?: { bookings?: number };
};

type RawBenefit = {
  id: string;
  translations?: Translation[];
  createdAt?: string;
  _count?: { poojas?: number };
};
type RawOffering = {
  id: string;
  actualPrice: number | string;
  discountPrice: number | string;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt?: string;
  translations?: Translation[];
  _count?: { poojas?: number };
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

function normalizeSupportTicket(ticket: RawSupportTicket): SupportTicket {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber ?? ticket.id,
    userId: ticket.userId ?? null,
    name: ticket.name ?? "-",
    phoneNumber: ticket.phoneNumber ?? "-",
    contactMethod: ticket.contactMethod ?? "WHATSAPP",
    problem: ticket.problem ?? "-",
    status: ticket.status,
    createdAt: ticket.createdAt ?? "",
    updatedAt: ticket.updatedAt ?? "",
    resolvedAt: ticket.resolvedAt ?? null,
    resolvedBy: ticket.resolvedBy ?? null
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
    offeringIds: pooja.offerings?.map((offering) => offering.id) ?? [],
    imageUrls: pooja.imageUrls ?? [],
    counts: pooja._count ? { bookings: pooja._count.bookings ?? 0 } : undefined
  };
}

function normalizeBenefit(benefit: RawBenefit): Benefit {
  return {
    id: benefit.id,
    name: pickTranslation(benefit.translations)?.name ?? benefit.id,
    translations: benefit.translations ?? [],
    poojaCount: benefit._count?.poojas ?? 0,
    createdAt: benefit.createdAt ?? ""
  };
}
function normalizeOffering(offering: RawOffering): Offering {
  const translation = pickTranslation(offering.translations);
  return {
    id: offering.id,
    name: translation?.name ?? "-",
    description: translation?.description ?? "",
    actualPrice: Number(offering.actualPrice),
    discountPrice: Number(offering.discountPrice),
    isActive: offering.isActive,
    imageUrl: offering.imageUrl ?? undefined,
    translations: offering.translations ?? [],
    poojaCount: offering._count?.poojas ?? 0,
    createdAt: offering.createdAt ?? ""
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

export async function getSupportTickets(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawSupportTicket>>("/support", { params });
  return normalizePaginated(data, normalizeSupportTicket);
}

export async function updateSupportTicketStatus(id: string, status: SupportTicketStatus) {
  const { data } = await apiClient.patch<RawSupportTicket>(`/support/${id}/status`, { status });
  return normalizeSupportTicket(data);
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
  const { data } = await apiClient.get<RawPaginatedResponse<RawBenefit>>("/benifits", { params });
  return normalizePaginated(data, normalizeBenefit);
}
export async function getBenefit(id: string) {
  const { data } = await apiClient.get<RawBenefit>(`/benifits/${id}`);
  return normalizeBenefit(data);
}

export async function upsertBenefit(translations: Translation[], id?: string) {
  const payload = { translations };
  const { data } = id
    ? await apiClient.patch<RawBenefit>(`/benifits/${id}`, payload)
    : await apiClient.post<RawBenefit>("/benifits", payload);
  return normalizeBenefit(data);
}

export async function deleteBenefit(id: string) {
  const { data } = await apiClient.delete<RawBenefit>(`/benifits/${id}`);
  return normalizeBenefit(data);
}

export type OfferingListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

export async function getOfferings(params: OfferingListParams = { page: 1, limit: 20 }) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawOffering>>("/offerings", { params });
  return normalizePaginated(data, normalizeOffering);
}

export async function getOffering(id: string) {
  const { data } = await apiClient.get<RawOffering>(`/offerings/${id}`);
  return normalizeOffering(data);
}

export async function upsertOffering(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawOffering>(`/offerings/${id}`, payload, { headers: { "Content-Type": "multipart/form-data" } })
    : await apiClient.post<RawOffering>("/offerings", payload, { headers: { "Content-Type": "multipart/form-data" } });
  return normalizeOffering(data);
}

export async function deleteOffering(id: string) {
  const { data } = await apiClient.delete<RawOffering>(`/offerings/${id}`);
  return normalizeOffering(data);
}
