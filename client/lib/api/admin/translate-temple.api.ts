import {
  generateTempleTranslationsApi,
  type TempleTranslationSourceInput,
} from "@/lib/api/admin/temples.api";

export default async function translateTemple(
  englishTranslation: TempleTranslationSourceInput,
) {
  return generateTempleTranslationsApi(englishTranslation);
}
