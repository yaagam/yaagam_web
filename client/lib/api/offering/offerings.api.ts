import instance from "@/lib/api/axios/axios.instance";
import { serverCache } from "@/lib/api/cache";
import type { PoojaLanguage } from "@/lib/api/pooja/poojas.api";

export type OfferingTranslation = {
  language: PoojaLanguage;
  name: string;
  description: string;
};

export type Offering = {
  slug: string;
  actualPrice: string | number;
  discountPrice: string | number | null;
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

export const getActiveOfferingsApi = serverCache(
  async function getActiveOfferingsApi() {
    const response = await instance.get("/offerings", {
      params: { isActive: true, page: 1, limit: 100 },
    });
    const data = getResponseData(response.data);
    const items =
      data && typeof data === "object"
        ? (data as OfferingsResponse).items
        : undefined;

    return Array.isArray(items) ? items.filter(isOffering) : [];
  },
);
