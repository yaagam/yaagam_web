import { publicApiGet, serverCache } from "@/lib/api/cache";
import type { Benifit } from "@/lib/api/benifit/benifits.api";
import type { Offering } from "@/lib/api/offering/offerings.api";
import type { Temple } from "@/lib/api/temple/temples.api";

export const poojaLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type PoojaLanguage = (typeof poojaLanguages)[number];

export type PoojaTranslation = {
  language: PoojaLanguage;
  name: string;
  about: string;
  poojaFor: string;
};

export type Pooja = {
  slug: string;
  isActive?: boolean;
  baseAmount: string | number;
  sellingPrice: string | number;
  imageUrls?: string[];
  poojaDay: string;
  time: string;
  poojaTime?: string;
  isWeekly: boolean;
  recommendedWeeks: number;
  createdAt: string;
  updatedAt: string;
  translations: PoojaTranslation[];
  benefits: Benifit[];
  offerings?: Offering[];
  temple: Temple;
};

export type PoojaDetails = Pooja & {
  _count: {
    bookings: number;
  };
};

export type PoojasMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PoojaCategoryFilter = "weekly" | "normal" | "";

export type GetPoojasParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: PoojaCategoryFilter;
  benefitSlug?: string;
  templeSlug?: string;
};

export type PoojasResponse = {
  items: Pooja[];
  meta: PoojasMeta;
};

const emptyMeta: PoojasMeta = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function getResponseData(responseData: unknown) {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as { data?: unknown }).data;
  }

  return responseData;
}

import { normalizeAmount } from "@/lib/utils";

export function formatPoojaTime(value?: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) return "";

  const match = normalizedValue.match(
    /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/i,
  );

  if (!match) return normalizedValue;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();

  if (minutes > 59 || hours > (meridiem ? 12 : 23)) return normalizedValue;

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  const displayMeridiem = hours >= 12 ? "PM" : "AM";

  return `${displayHours}:${displayMinutes} ${displayMeridiem}`;
}

export function normalizePooja(pooja: Pooja): Pooja {
  const rawTime = pooja.time ?? pooja.poojaTime ?? "";

  return {
    ...pooja,
    baseAmount: normalizeAmount(pooja.baseAmount),
    sellingPrice: normalizeAmount(pooja.sellingPrice),
    time: rawTime,
    poojaTime: formatPoojaTime(rawTime),
  };
}

function isPublicPooja(pooja: Pooja) {
  return pooja.isActive !== false && pooja.temple?.isActive !== false;
}

function normalizePoojasResponse(data: unknown): PoojasResponse {
  if (Array.isArray(data)) {
    return {
      items: (data as Pooja[]).filter(isPublicPooja).map(normalizePooja),
      meta: {
        ...emptyMeta,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (data && typeof data === "object") {
    const response = data as Partial<PoojasResponse>;

    return {
      items: Array.isArray(response.items)
        ? response.items.filter(isPublicPooja).map(normalizePooja)
        : [],
      meta: {
        ...emptyMeta,
        ...(response.meta ?? {}),
      },
    };
  }

  return {
    items: [],
    meta: emptyMeta,
  };
}

export const getPoojasApi = serverCache(async function getPoojasApi(
  params: GetPoojasParams = {},
) {
  const responseData = await publicApiGet<unknown>(
    "/poojas",
    {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      category: params.category || undefined,
      benefitSlug: params.benefitSlug || undefined,
      templeSlug: params.templeSlug || undefined,
    },
    { tags: ["poojas"] },
  );
  const data = getResponseData(responseData);

  return normalizePoojasResponse(data);
});

export const getPoojaDetailsApi = serverCache(async function getPoojaDetailsApi(
  slug: string,
) {
  const responseData = await publicApiGet<unknown>(`/poojas/${slug}`, {}, { tags: ["poojas", `pooja:${slug}`] });
  const data = getResponseData(responseData);

  return normalizePooja(data as PoojaDetails) as PoojaDetails;
});
