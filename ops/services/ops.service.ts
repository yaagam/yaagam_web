import { AxiosError } from "axios";
import { apiClient } from "@/services/api-client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Benefit,
  Booking,
  BookingStatus,
  Offering,
  Pooja,
  PoojaDetails,
  SupportContactMethod,
  SupportTicket,
  SupportTicketStatus,
  Temple,
  TempleDetails,
  Translation,
  User,
  ZohoSyncStatus,
} from "@/types/ops";

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
  pooja?: { name?: string; benefits?: { id: string; name?: string; translations?: Translation[] }[] } | null;
  benefits?: { id: string; name?: string; translations?: Translation[] }[];
  bookingDate?: string;
  poojaDate?: string;
  amount?: number | { final?: number; base?: number };
  status: BookingStatus;
  zohoSyncStatus?: ZohoSyncStatus;
  zohoSyncError?: string | null;
  zohoSalesOrderId?: string | null;
  zohoInvoiceId?: string | null;
  zohoPaymentId?: string | null;
  zohoBillId?: string | null;
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
  isActive?: boolean;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  createdAt?: string;
  translations?: Translation[];
  _count?: { poojas?: number; bookings?: number };
  zohoVendorId?: string | null;
  zohoSyncStatus?: Temple["zohoSyncStatus"];
  zohoSyncError?: string | null;
  lastZohoSyncAt?: string | null;
  templePriest?: { name?: string; experience?: string } | null;
};

type RawPooja = {
  id: string;
  templeId?: string;
  name?: string;
  templeName?: string;
  templeAmount?: number | string;
  baseAmount?: number | string;
  sellingPrice?: number | string;
  poojaDay?: string;
  time?: string;
  isWeekly?: boolean;
  recommendedWeeks?: number;
  isActive?: boolean;
  createdAt?: string;
  translations?: Translation[];
  temple?: { id?: string; translations?: Translation[] } | null;
  benefits?: { id: string; translations?: Translation[] }[];
  offerings?: { id: string }[];
  imageUrls?: string[];
  _count?: { bookings?: number };
  zohoItemId?: string | null;
  zohoSyncStatus?: Pooja["zohoSyncStatus"];
  zohoSyncError?: string | null;
  lastZohoSyncAt?: string | null;
};

type RawBenefit = {
  id: string;
  translations?: Translation[];
  createdAt?: string;
  _count?: { poojas?: number };
  poojas?: { id: string; name?: string; translations?: Translation[] }[];
};
type RawUser = User;
type RawOffering = {
  id: string;
  name?: string;
  description?: string;
  templeAmount?: number | string;
  templeOfferingAmount?: number | string;
  basePrice?: number | string;
  baseAmount?: number | string;
  customerBasePrice?: number | string;
  sellingPrice?: number | string;
  customerDiscountPrice?: number | string;
  isActive?: boolean;
  imageUrl?: string | null;
  image?: string | null;
  createdAt?: string;
  translations?: Translation[];
  _count?: { poojas?: number };
  zohoItemId?: string | null;
  zohoSyncStatus?: Offering['zohoSyncStatus'];
  zohoSyncError?: string | null;
  lastZohoSyncAt?: string | null;
};

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
};

function pickTranslation(translations?: Translation[]) {
  return (
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0]
  );
}

function normalizeAssetUrl(value?: string | null) {
  if (!value) return undefined;
  return value;
}
function normalizeBooking(booking: RawBooking): Booking {
  const amount =
    typeof booking.amount === "number"
      ? booking.amount
      : (booking.amount?.final ?? booking.amount?.base ?? 0);

  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber ?? booking.id,
    customerName:
      booking.customerName ??
      booking.user?.whatsappNumber ??
      booking.bookingWhatsappNumber ??
      "-",
    customerPhone:
      booking.customerPhone ??
      booking.bookingWhatsappNumber ??
      booking.user?.whatsappNumber ??
      "-",
    templeName: booking.templeName ?? booking.temple?.name ?? "-",
    poojaName: booking.poojaName ?? booking.pooja?.name ?? "-",
    benefits: (booking.benefits ?? booking.pooja?.benefits ?? []).map((benefit) => ({
      id: benefit.id,
      name: benefit.name ?? pickTranslation(benefit.translations)?.name ?? benefit.id,
    })),
    bookingDate:
      booking.bookingDate ?? booking.poojaDate ?? booking.createdAt ?? "",
    amount,
    status: booking.status,
    zohoSyncStatus: booking.zohoSyncStatus ?? "PENDING",
    zohoSyncError: booking.zohoSyncError ?? null,
    zohoSalesOrderId: booking.zohoSalesOrderId ?? null,
    zohoInvoiceId: booking.zohoInvoiceId ?? null,
    zohoPaymentId: booking.zohoPaymentId ?? null,
    zohoBillId: booking.zohoBillId ?? null,
    createdAt: booking.createdAt ?? "",
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
    resolvedBy: ticket.resolvedBy ?? null,
  };
}

function normalizeTemple(temple: RawTemple): Temple {
  const translation = pickTranslation(temple.translations);

  return {
    id: temple.id,
    name: temple.name ?? translation?.name ?? "-",
    city: temple.city ?? translation?.place ?? translation?.district ?? "-",
    state: temple.state ?? "-",
    isActive: temple.isActive ?? true,
    imageUrl: normalizeAssetUrl(temple.imageUrl ?? temple.image),
    createdAt: temple.createdAt ?? "",
    zohoVendorId: temple.zohoVendorId ?? null,
    zohoSyncStatus: temple.zohoSyncStatus ?? "PENDING",
    zohoSyncError: temple.zohoSyncError ?? null,
    lastZohoSyncAt: temple.lastZohoSyncAt ?? null,
  };
}

function normalizeTempleDetails(temple: RawTemple): TempleDetails {
  return {
    ...normalizeTemple(temple),
    email: temple.email,
    templePriest: {
      name: temple.templePriest?.name ?? "",
      experience: temple.templePriest?.experience ?? "",
    },
    description: temple.description ?? "",
    translations: temple.translations ?? [],
    counts: temple._count
      ? {
          poojas: temple._count.poojas ?? 0,
          bookings: temple._count.bookings ?? 0,
        }
      : undefined,
  };
}

function normalizePooja(pooja: RawPooja): Pooja {
  const translation = pickTranslation(pooja.translations);
  const templeTranslation = pickTranslation(pooja.temple?.translations);
  return {
    id: pooja.id,
    name: pooja.name ?? translation?.name ?? "-",
    templeName: pooja.templeName ?? templeTranslation?.name ?? "-",
    templeAmount: Number(pooja.templeAmount ?? 0),
    baseAmount: Number(pooja.baseAmount ?? 0),
    sellingPrice: Number(pooja.sellingPrice ?? 0),
    isWeekly: Boolean(pooja.isWeekly),
    recommendedWeeks: pooja.recommendedWeeks ?? 2,
    isActive: pooja.isActive ?? true,
    createdAt: pooja.createdAt ?? "",
    zohoItemId: pooja.zohoItemId ?? null,
    zohoSyncStatus: pooja.zohoSyncStatus ?? "PENDING",
    zohoSyncError: pooja.zohoSyncError ?? null,
    lastZohoSyncAt: pooja.lastZohoSyncAt ?? null,
  };
}

function normalizePoojaDetails(pooja: RawPooja): PoojaDetails {
  return {
    ...normalizePooja(pooja),
    templeId: pooja.templeId ?? pooja.temple?.id ?? "",
    poojaDay: pooja.poojaDay ?? "",
    time: pooja.time ?? "09:00",
    translations: pooja.translations ?? [],
    benefitIds: pooja.benefits?.map((benefit) => benefit.id) ?? [],
    offeringIds: pooja.offerings?.map((offering) => offering.id) ?? [],
    imageUrls:
      pooja.imageUrls?.map((url) => normalizeAssetUrl(url) ?? url) ?? [],
    counts: pooja._count ? { bookings: pooja._count.bookings ?? 0 } : undefined,
  };
}

function normalizeBenefit(benefit: RawBenefit): Benefit {
  return {
    id: benefit.id,
    name: pickTranslation(benefit.translations)?.name ?? benefit.id,
    translations: benefit.translations ?? [],
    poojaCount: benefit._count?.poojas ?? 0,
    poojas: (benefit.poojas ?? []).map((pooja) => ({
      id: pooja.id,
      name: pooja.name ?? pickTranslation(pooja.translations)?.name ?? pooja.id,
    })),
    createdAt: benefit.createdAt ?? "",
  };
}
function normalizeOffering(offering: RawOffering): Offering {
  const translation = pickTranslation(offering.translations);
  return {
    id: offering.id,
    name: offering.name ?? translation?.name ?? "-",
    description: offering.description ?? translation?.description ?? "",
    templeAmount: Number(offering.templeAmount ?? offering.templeOfferingAmount ?? 0),
    basePrice: Number(offering.basePrice ?? offering.baseAmount ?? offering.customerBasePrice ?? 0),
    sellingPrice: Number(offering.sellingPrice ?? offering.customerDiscountPrice ?? 0),
    isActive: offering.isActive ?? true,
    imageUrl: normalizeAssetUrl(offering.imageUrl ?? offering.image),
    translations: offering.translations ?? [],
    poojaCount: offering._count?.poojas ?? 0,
    zohoItemId: offering.zohoItemId ?? null,
    zohoSyncStatus: offering.zohoSyncStatus ?? 'PENDING',
    zohoSyncError: offering.zohoSyncError ?? null,
    lastZohoSyncAt: offering.lastZohoSyncAt ?? null,
    createdAt: offering.createdAt ?? "",
  };
}

function normalizePaginated<TInput, TOutput>(
  response: RawPaginatedResponse<TInput>,
  normalize: (item: TInput) => TOutput,
): PaginatedResponse<TOutput> {
  return {
    items: response.items.map(normalize),
    meta: response.meta,
  };
}

export type TranslationPayload = Record<string, unknown>;

export type GeneratedTranslations<T extends TranslationPayload> = {
  ML?: T;
  HI?: T;
  MR?: T;
  TA?: T;
};

export async function generateTranslations<T extends TranslationPayload>(
  data: T,
) {
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
      TA: result.tamil,
    } satisfies GeneratedTranslations<T>;
  } catch (error) {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as
        | { message?: string | string[] }
        | undefined;
      const message = Array.isArray(responseData?.message)
        ? responseData.message.join(" ")
        : responseData?.message;
      throw new Error(
        message ||
          `Translation request failed with status ${error.response?.status ?? "unknown"}.`,
      );
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
  const requestParams = { ...params };
  if (!requestParams.status) delete requestParams.status;
  const { data } = await apiClient.get<RawPaginatedResponse<RawSupportTicket>>(
    "/support",
    { params: requestParams },
  );
  return normalizePaginated(data, normalizeSupportTicket);
}

export async function updateSupportTicketStatus(
  id: string,
  status: SupportTicketStatus,
) {
  const { data } = await apiClient.patch<RawSupportTicket>(
    `/support/${id}/status`,
    { status },
  );
  return normalizeSupportTicket(data);
}

export async function getBookings(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawBooking>>(
    "/bookings",
    { params },
  );
  return normalizePaginated(data, normalizeBooking);
}

export async function getBooking(id: string) {
  const { data } = await apiClient.get<RawBooking>(`/bookings/${id}`);
  return normalizeBooking(data);
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data } = await apiClient.patch<RawBooking>(`/bookings/${id}/status`, {
    status,
  });
  return normalizeBooking(data);
}

export async function getTemples(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawTemple>>(
    "/temples",
    { params },
  );
  return normalizePaginated(data, normalizeTemple);
}

export async function getTemple(id: string) {
  const { data } = await apiClient.get<RawTemple>(`/temples/${id}`);
  return normalizeTempleDetails(data);
}

export async function upsertTemple(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawTemple>(`/temples/${id}`, payload)
    : await apiClient.post<RawTemple>("/temples", payload);
  return normalizeTempleDetails(data);
}

export async function syncTempleWithZoho(id: string) {
  const { data } = await apiClient.post<RawTemple>(`/temples/${id}/sync-zoho`);
  return normalizeTempleDetails(data);
}
export async function deleteTemple(id: string) {
  const { data } = await apiClient.delete<RawTemple>(`/temples/${id}`);
  return normalizeTempleDetails(data);
}

export async function getPoojas(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawPooja>>(
    "/poojas",
    { params },
  );
  return normalizePaginated(data, normalizePooja);
}

export async function getPooja(id: string) {
  const { data } = await apiClient.get<RawPooja>(`/poojas/${id}`);
  return normalizePoojaDetails(data);
}

export async function upsertPooja(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawPooja>(`/poojas/${id}`, payload)
    : await apiClient.post<RawPooja>("/poojas", payload);
  return normalizePoojaDetails(data);
}

export async function syncPoojaWithZoho(id: string) {
  const { data } = await apiClient.post<RawPooja>(`/poojas/${id}/sync-zoho`);
  return normalizePoojaDetails(data);
}

export async function deletePooja(id: string) {
  const { data } = await apiClient.delete<RawPooja>(`/poojas/${id}`);
  return normalizePoojaDetails(data);
}

export async function getBenefits(
  params: ListParams = { page: 1, limit: 100 },
) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawBenefit>>(
    "/benifits",
    { params },
  );
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

export async function getOfferings(
  params: OfferingListParams = { page: 1, limit: 20 },
) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawOffering>>(
    "/offerings",
    { params },
  );
  return normalizePaginated(data, normalizeOffering);
}

export async function getOffering(id: string) {
  const { data } = await apiClient.get<RawOffering>(`/offerings/${id}`);
  return normalizeOffering(data);
}

export async function upsertOffering(payload: FormData, id?: string) {
  const { data } = id
    ? await apiClient.patch<RawOffering>(`/offerings/${id}`, payload)
    : await apiClient.post<RawOffering>("/offerings", payload);
  return normalizeOffering(data);
}

export async function syncOfferingWithZoho(id: string) {
  const { data } = await apiClient.post<RawOffering>(
    `/offerings/${id}/sync-zoho`,
  );
  return normalizeOffering(data);
}

export async function retryBookingZohoSync(id: string) {
  const { data } = await apiClient.post<RawBooking>(
    `/bookings/${id}/zoho/retry`,
  );
  return normalizeBooking(data);
}

export async function deleteOffering(id: string) {
  const { data } = await apiClient.delete<RawOffering>(`/offerings/${id}`);
  return normalizeOffering(data);
}

export async function getUsers(params: ListParams) {
  const { data } = await apiClient.get<RawPaginatedResponse<RawUser>>(
    "/users",
    { params },
  );
  return data;
}
