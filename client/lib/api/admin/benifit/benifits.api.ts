import axios from "axios";

import instance from "@/lib/api/axios/axios.instance";
import { getErrorMessage } from "@/lib/utils";

export const benifitLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type BenifitLanguage = (typeof benifitLanguages)[number];

export type BenifitTranslation = {
  id: string;
  benefitId: string;
  language: BenifitLanguage;
  name: string;
  description: string;
};

export type Benifit = {
  id: string;
  imageKey?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  translations: BenifitTranslation[];
};

export type BenifitDetails = Benifit & {
  _count: {
    poojas: number;
  };
};

export type BenifitTranslationInput = {
  language: BenifitLanguage;
  name: string;
  description: string;
};

export type BenifitMutationInput = {
  translations: BenifitTranslationInput[];
  image?: File | null;
};

export type BenifitTranslationSourceInput = {
  name: string;
  description: string;
};

export type GeneratedBenifitTranslations = Partial<
  Record<Exclude<BenifitLanguage, "EN">, BenifitTranslationSourceInput>
>;

export type BenifitsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type BenifitsResponse = {
  items: Benifit[];
  meta: BenifitsMeta;
};

export type GetAdminBenifitsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export class BenifitApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BenifitApiError";
    this.status = status;
  }
}

const emptyMeta: BenifitsMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function normalizeBenifitsResponse(data: unknown): BenifitsResponse {
  if (Array.isArray(data)) {
    return {
      items: data as Benifit[],
      meta: {
        ...emptyMeta,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (data && typeof data === "object") {
    const response = data as Partial<BenifitsResponse>;

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

function createBenifitFormData(input: BenifitMutationInput) {
  const formData = new FormData();

  formData.append("translations", JSON.stringify(input.translations));
  if (input.image) formData.append("image", input.image);

  return formData;
}

function throwBenifitApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    throw new BenifitApiError(
      getErrorMessage(error.response?.data?.message, fallback),
      error.response?.status,
    );
  }

  throw new BenifitApiError(getErrorMessage(error, fallback));
}

function isTranslationSource(
  value: unknown,
): value is BenifitTranslationSourceInput {
  if (!value || typeof value !== "object") return false;

  const translation = value as Partial<BenifitTranslationSourceInput>;

  return (
    typeof translation.name === "string" &&
    typeof translation.description === "string"
  );
}

function normalizeGeneratedBenifitTranslations(
  data: unknown,
): GeneratedBenifitTranslations {
  if (!data || typeof data !== "object") return {};

  const result = data as Record<string, unknown>;
  const generated: GeneratedBenifitTranslations = {};

  if (isTranslationSource(result.malayalam)) generated.ML = result.malayalam;
  if (isTranslationSource(result.hindi)) generated.HI = result.hindi;
  if (isTranslationSource(result.marathi)) generated.MR = result.marathi;
  if (isTranslationSource(result.tamil)) generated.TA = result.tamil;

  return generated;
}

export async function getAdminBenifitsApi(
  params: GetAdminBenifitsParams = {},
) {
  const response = await instance.get("/benifits", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });
  const data = getResponseData(response.data);

  return normalizeBenifitsResponse(data);
}

export async function getBenifitDetailsApi(id: string) {
  try {
    const response = await instance.get(`/benifits/${id}`);
    return getResponseData(response.data) as BenifitDetails;
  } catch (error: unknown) {
    throwBenifitApiError(error, "Benifit details failed. Please try again.");
  }
}

export async function createBenifitApi(input: BenifitMutationInput) {
  try {
    const response = await instance.post(
      "/benifits",
      createBenifitFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return getResponseData(response.data) as Benifit;
  } catch (error: unknown) {
    throwBenifitApiError(error, "Benifit create failed. Please try again.");
  }
}

export async function updateBenifitApi(
  id: string,
  input: BenifitMutationInput,
) {
  try {
    const response = await instance.patch(
      `/benifits/${id}`,
      createBenifitFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return getResponseData(response.data) as Benifit;
  } catch (error: unknown) {
    throwBenifitApiError(error, "Benifit update failed. Please try again.");
  }
}

export async function deleteBenifitApi(id: string) {
  try {
    const response = await instance.delete(`/benifits/${id}`);

    return getResponseData(response.data) as Benifit;
  } catch (error: unknown) {
    throwBenifitApiError(error, "Benifit delete failed. Please try again.");
  }
}

export async function generateBenifitTranslationsApi(
  englishTranslation: BenifitTranslationSourceInput,
) {
  try {
    const response = await instance.post("/translations", {
      data: englishTranslation,
      sourceLanguage: "en",
    });
    const data = getResponseData(response.data);

    return normalizeGeneratedBenifitTranslations(data);
  } catch (error: unknown) {
    throwBenifitApiError(error, "Benifit translation failed. Please try again.");
  }
}
