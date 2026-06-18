import { deleteTempleApi as deleteTemple } from "@/lib/api/admin/temples.api";

export default async function deleteTempleApi(id: string) {
  return deleteTemple(id);
}
