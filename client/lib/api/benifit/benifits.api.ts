import instance from "@/lib/api/axios/axios.instance";

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

export type GetBenifitsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const emptyMeta: BenifitsMeta = {
  page: 1,
  limit: 10,
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

export async function getBenifitsApi(params: GetBenifitsParams = {}) {
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