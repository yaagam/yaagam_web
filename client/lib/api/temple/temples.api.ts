import instance from "@/lib/api/axios/axios.instance";
import { serverCache } from "@/lib/api/cache";

export const templeLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type TempleLanguage = (typeof templeLanguages)[number];

export type TempleTranslation = {
  language: TempleLanguage;
  name: string;
  district: string;
  place: string;
  description?: string;
};

export type Temple = {
  slug: string;
  email?: string | null;
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

export type GetTemplesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const emptyMeta: TemplesMeta = {
  page: 1,
  limit: 10,
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

export function hasValidTempleSlug(
  temple: Partial<Temple>,
): temple is Temple {
  const slug = temple.slug?.trim();

  return Boolean(slug && slug !== "undefined" && slug !== "null");
}
function normalizeTemplesResponse(data: unknown): TemplesResponse {
  if (Array.isArray(data)) {
    return {
      items: (data as Partial<Temple>[]).filter(hasValidTempleSlug),
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
      items: Array.isArray(response.items)
        ? response.items.filter(hasValidTempleSlug)
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

export const getTemplesApi = serverCache(async function getTemplesApi(
  params: GetTemplesParams = {},
) {
  const response = await instance.get("/temples", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });
  const data = getResponseData(response.data);

  return normalizeTemplesResponse(data);
});

export const getTempleDetailsApi = serverCache(
  async function getTempleDetailsApi(slug: string) {
    const response = await instance.get(`/temples/${slug}`);

    return getResponseData(response.data) as TempleDetails;
  },
);
