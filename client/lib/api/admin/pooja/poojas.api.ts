import axios from "axios";

import instance from "@/lib/api/axios/axios.instance";
import type { Benifit } from "@/lib/api/admin/benifit/benifits.api";
import type { Temple } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

export const poojaLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type PoojaLanguage = (typeof poojaLanguages)[number];

export type PoojaTranslation = {
  id: string;
  poojaId: string;
  language: PoojaLanguage;
  name: string;
  about: string;
};

export type Pooja = {
  id: string;
  templeId: string;
  baseAmount: string | number;
  imageKeys: string[];
  imageUrls?: string[];
  poojaDay: string;
  poojaTime: string;
  isWeekly: boolean;
  weeklyDiscount: number | null;
  normalDiscount: number | null;
  createdAt: string;
  updatedAt: string;
  translations: PoojaTranslation[];
  benefits: Benifit[];
  temple: Temple;
};

export type PoojaDetails = Pooja & {
  _count: {
    bookings: number;
  };
};

export type PoojaTranslationInput = {
  language: PoojaLanguage;
  name: string;
  about: string;
};

export type PoojaMutationInput = {
  templeId: string;
  baseAmount: string;
  poojaDay: string;
  poojaTime: string;
  isWeekly: boolean;
  weeklyDiscount: number;
  normalDiscount: number;
  benefitIds: string[];
  translations: PoojaTranslationInput[];
  images?: File[];
};

export type PoojaTranslationSourceInput = {
  name: string;
  about: string;
};

export type GeneratedPoojaTranslations = Partial<
  Record<Exclude<PoojaLanguage, "EN">, PoojaTranslationSourceInput>
>;

export type PoojasMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PoojasResponse = {
  items: Pooja[];
  meta: PoojasMeta;
};

export type GetAdminPoojasParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export class PoojaApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PoojaApiError";
    this.status = status;
  }
}

const emptyMeta: PoojasMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function normalizePoojasResponse(data: unknown): PoojasResponse {
  if (Array.isArray(data)) {
    return {
      items: data as Pooja[],
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
      items: Array.isArray(response.items) ? response.items : [],
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

function getResponseData(responseData: unknown) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: unknown }).data;
  }

  return responseData;
}

function createPoojaFormData(input: PoojaMutationInput) {
  const formData = new FormData();

  formData.append("templeId", input.templeId);
  formData.append("baseAmount", input.baseAmount);
  formData.append("poojaDay", input.poojaDay);
  formData.append("poojaTime", input.poojaTime);
  formData.append("isWeekly", String(input.isWeekly));
  formData.append("weeklyDiscount", String(input.weeklyDiscount));
  formData.append("normalDiscount", String(input.normalDiscount));
  formData.append("benefitIds", JSON.stringify(input.benefitIds));
  formData.append("translations", JSON.stringify(input.translations));

  for (const image of input.images ?? []) {
    formData.append("images", image);
  }

  return formData;
}

function throwPoojaApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    throw new PoojaApiError(
      getErrorMessage(error.response?.data?.message, fallback),
      error.response?.status,
    );
  }

  throw new PoojaApiError(getErrorMessage(error, fallback));
}

function isTranslationSource(value: unknown): value is PoojaTranslationSourceInput {
  if (!value || typeof value !== "object") return false;

  const translation = value as Partial<PoojaTranslationSourceInput>;

  return (
    typeof translation.name === "string" &&
    typeof translation.about === "string"
  );
}

function normalizeGeneratedPoojaTranslations(
  data: unknown,
): GeneratedPoojaTranslations {
  if (!data || typeof data !== "object") return {};

  const result = data as Record<string, unknown>;
  const generated: GeneratedPoojaTranslations = {};

  if (isTranslationSource(result.malayalam)) generated.ML = result.malayalam;
  if (isTranslationSource(result.hindi)) generated.HI = result.hindi;
  if (isTranslationSource(result.marathi)) generated.MR = result.marathi;
  if (isTranslationSource(result.tamil)) generated.TA = result.tamil;

  return generated;
}

export async function getAdminPoojasApi(params: GetAdminPoojasParams = {}) {
  const response = await instance.get("/poojas", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });
  const data = getResponseData(response.data);

  return normalizePoojasResponse(data);
}

export async function getPoojaDetailsApi(id: string) {
  try {
    const response = await instance.get(`/poojas/${id}`);
    return getResponseData(response.data) as PoojaDetails;
  } catch (error: unknown) {
    throwPoojaApiError(error, "Pooja details failed. Please try again.");
  }
}

export async function createPoojaApi(input: PoojaMutationInput) {
  try {
    const response = await instance.post("/poojas", createPoojaFormData(input), {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return getResponseData(response.data) as Pooja;
  } catch (error: unknown) {
    throwPoojaApiError(error, "Pooja create failed. Please try again.");
  }
}

export async function updatePoojaApi(id: string, input: PoojaMutationInput) {
  try {
    const response = await instance.patch(
      `/poojas/${id}`,
      createPoojaFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return getResponseData(response.data) as Pooja;
  } catch (error: unknown) {
    throwPoojaApiError(error, "Pooja update failed. Please try again.");
  }
}

export async function deletePoojaApi(id: string) {
  try {
    const response = await instance.delete(`/poojas/${id}`);

    return getResponseData(response.data) as Pooja;
  } catch (error: unknown) {
    throwPoojaApiError(error, "Pooja delete failed. Please try again.");
  }
}

export async function generatePoojaTranslationsApi(
  englishTranslation: PoojaTranslationSourceInput,
) {
  try {
    const response = await instance.post("/translations", {
      data: englishTranslation,
      sourceLanguage: "en",
    });
    const data = getResponseData(response.data);

    return normalizeGeneratedPoojaTranslations(data);
  } catch (error: unknown) {
    throwPoojaApiError(error, "Pooja translation failed. Please try again.");
  }
}
