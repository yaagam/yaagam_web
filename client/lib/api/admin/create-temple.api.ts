import {
  createTempleApi,
  type TempleMutationInput,
} from "@/lib/api/admin/temples.api";

export default async function createTemple(input: TempleMutationInput) {
  return createTempleApi(input);
}
