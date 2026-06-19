import {
  updateTempleApi,
  type TempleMutationInput,
} from "@/lib/api/admin/temple/temples.api";

export default async function updateTemple(
  id: string,
  input: TempleMutationInput,
) {
  return updateTempleApi(id, input);
}
