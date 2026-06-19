import instance from "@/lib/api/axios/axios.instance";
import type { Pooja, PoojasMeta } from "@/lib/api/admin/pooja/poojas.api";

export type PoojaCategoryFilter = "weekly" | "normal" | "";

export type GetPoojasParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: PoojaCategoryFilter;
  benifitId?: string;
  templeId?: string;
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

export async function getPoojasApi(params: GetPoojasParams = {}) {
  const response = await instance.get("/poojas", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      category: params.category || undefined,
      benifitId: params.benifitId || undefined,
      templeId: params.templeId || undefined,
    },
  });
  const data = getResponseData(response.data);

  return normalizePoojasResponse(data);
}
