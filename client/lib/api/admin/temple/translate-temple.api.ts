import {
  generateTempleTranslationsApi,
  type TempleTranslationSourceInput,
} from "@/lib/api/admin/temple/temples.api";

export default async function translateTemple(
  englishTranslation: TempleTranslationSourceInput,
) {
  return generateTempleTranslationsApi(englishTranslation);
}
