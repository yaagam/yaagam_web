import instance from "@/lib/api/axios/axios.instance";
import axios from "axios";

import { getErrorMessage } from "@/lib/utils";

export const templeLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type TempleLanguage = (typeof templeLanguages)[number];

export type TempleTranslation = {
  id: string;
  templeId: string;
  language: TempleLanguage;
  name: string;
  district: string;
  place: string;
};

export type Temple = {
  id: string;
  imageKey?: string | null;
  imageUrl?: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  translations: TempleTranslation[];
};

export type TempleDetails = Temple & {
  _count: {
    poojas: number;
    bookings: number;
  };
};

export type TempleTranslationInput = {
  language: TempleLanguage;
  name: string;
  district: string;
  place: string;
};

export type TempleMutationInput = {
  state: string;
  translations: TempleTranslationInput[];
  image?: File | null;
};

export type TempleTranslationSourceInput = {
  name: string;
  district: string;
  place: string;
};

export type GeneratedTempleTranslations = Partial<
  Record<Exclude<TempleLanguage, "EN">, TempleTranslationSourceInput>
>;

export type TemplesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TemplesResponse = {
  items: Temple[];
  meta: TemplesMeta;
};

export type GetAdminTemplesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export class TempleApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TempleApiError";
    this.status = status;
  }
}

const emptyMeta: TemplesMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function normalizeTemplesResponse(data: unknown): TemplesResponse {
  if (Array.isArray(data)) {
    return {
      items: data as Temple[],
      meta: {
        ...emptyMeta,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (data && typeof data === "object") {
    const response = data as Partial<TemplesResponse>;

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

function createTempleFormData(input: TempleMutationInput) {
  const formData = new FormData();

  formData.append("state", input.state);
  formData.append("translations", JSON.stringify(input.translations));
  if (input.image) formData.append("image", input.image);

  return formData;
}

function throwTempleApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    throw new TempleApiError(
      getErrorMessage(error.response?.data?.message, fallback),
      error.response?.status,
    );
  }

  throw new TempleApiError(getErrorMessage(error, fallback));
}

function isTranslationSource(value: unknown): value is TempleTranslationSourceInput {
  if (!value || typeof value !== "object") return false;

  const translation = value as Partial<TempleTranslationSourceInput>;

  return (
    typeof translation.name === "string" &&
    typeof translation.district === "string" &&
    typeof translation.place === "string"
  );
}

function normalizeGeneratedTempleTranslations(
  data: unknown,
): GeneratedTempleTranslations {
  if (!data || typeof data !== "object") return {};

  const result = data as Record<string, unknown>;
  const generated: GeneratedTempleTranslations = {};

  if (isTranslationSource(result.malayalam)) generated.ML = result.malayalam;
  if (isTranslationSource(result.hindi)) generated.HI = result.hindi;
  if (isTranslationSource(result.marathi)) generated.MR = result.marathi;
  if (isTranslationSource(result.tamil)) generated.TA = result.tamil;

  return generated;
}

export async function getAdminTemplesApi(params: GetAdminTemplesParams = {}) {
  const response = await instance.get("/temples", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });
  const data = getResponseData(response.data);

  return normalizeTemplesResponse(data);
}

export async function getTempleDetailsApi(id: string) {
  try {
    const response = await instance.get(`/temples/${id}`);
    return getResponseData(response.data) as TempleDetails;
  } catch (error: unknown) {
    throwTempleApiError(error, "Temple details failed. Please try again.");
  }
}

export async function createTempleApi(input: TempleMutationInput) {
  try {
    const response = await instance.post("/temples", createTempleFormData(input), {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return getResponseData(response.data) as Temple;
  } catch (error: unknown) {
    throwTempleApiError(error, "Temple create failed. Please try again.");
  }
}

export async function updateTempleApi(id: string, input: TempleMutationInput) {
  try {
    const response = await instance.patch(
      `/temples/${id}`,
      createTempleFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return getResponseData(response.data) as Temple;
  } catch (error: unknown) {
    throwTempleApiError(error, "Temple update failed. Please try again.");
  }
}

export async function deleteTempleApi(id: string) {
  try {
    const response = await instance.delete(`/temples/${id}`);

    return getResponseData(response.data) as Temple;
  } catch (error: unknown) {
    throwTempleApiError(error, "Temple delete failed. Please try again.");
  }
}

export async function generateTempleTranslationsApi(
  englishTranslation: TempleTranslationSourceInput,
) {
  try {
    const response = await instance.post("/translations", {
      data: englishTranslation,
      sourceLanguage: "en",
    });
    const data = getResponseData(response.data);

    return normalizeGeneratedTempleTranslations(data);
  } catch (error: unknown) {
    throwTempleApiError(error, "Temple translation failed. Please try again.");
  }
}
