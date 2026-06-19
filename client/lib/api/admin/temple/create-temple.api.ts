import {
  createTempleApi,
  type TempleMutationInput,
} from "@/lib/api/admin/temple/temples.api";

export default async function createTemple(input: TempleMutationInput) {
  return createTempleApi(input);
}
