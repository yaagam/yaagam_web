import { publicApiGet, serverCache } from "@/lib/api/cache";
import type { PoojaLanguage } from "@/lib/api/pooja/poojas.api";

export type OfferingTranslation = {
  language: PoojaLanguage;
  name: string;
  description: string;
};

export type Offering = {
  slug: string;
  basePrice: string | number;
  sellingPrice: string | number | null;
  isActive: boolean;
  imageUrl: string | null;
  translations: OfferingTranslation[];
};

type OfferingsResponse = {
  items?: unknown;
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

function isOffering(value: unknown): value is Offering {
  if (!value || typeof value !== "object") return false;

  const offering = value as Partial<Offering>;

  return (
    typeof offering.slug === "string" &&
    offering.isActive === true &&
    Array.isArray(offering.translations)
  );
}

import { normalizeAmount } from "@/lib/utils";

export const getActiveOfferingsApi = serverCache(
  async function getActiveOfferingsApi() {
    const responseData = await publicApiGet<unknown>("/offerings", { isActive: true, page: 1, limit: 100 }, { tags: ["offerings"] });
    const data = getResponseData(responseData);
    const items =
      data && typeof data === "object"
        ? (data as OfferingsResponse).items
        : undefined;

    const offerings = Array.isArray(items) ? items.filter(isOffering) : [];

    return offerings.map((offering) => ({
      ...offering,
      basePrice: normalizeAmount(offering.basePrice),
      sellingPrice: offering.sellingPrice ? normalizeAmount(offering.sellingPrice) : null,
    }));
  },
);
