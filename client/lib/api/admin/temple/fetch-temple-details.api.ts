import { getTempleDetailsApi } from "@/lib/api/admin/temple/temples.api";

export default async function fetchTempleDetailApi(id: string) {
  return getTempleDetailsApi(id);
}
