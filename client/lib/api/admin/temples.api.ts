import instance from "@/lib/api/axios/axios.instance";

export type TempleTranslation = {
  id: string;
  templeId: string;
  language: string;
  name: string;
  district: string;
  place: string;
};

export type Temple = {
  id: string;
  imageKey?: string | null;
  createdAt: string;
  updatedAt: string;
  translations: TempleTranslation[];
};

export async function getAdminTemplesApi() {
  const response = await instance.get("/temples");
  const data = response.data?.data ?? response.data;

  return Array.isArray(data) ? (data as Temple[]) : [];
}
