import type { Pooja, PoojaLanguage } from "@/lib/api/pooja/poojas.api";
import type { Language } from "@/translations/locales";

export const POOJA_LANGUAGE_BY_UI_LANGUAGE: Record<Language, PoojaLanguage> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};

function cleanImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((imageUrl): imageUrl is string => typeof imageUrl === "string")
    .map((imageUrl) => imageUrl.trim())
    .filter(Boolean);
}

export function getLocalizedPoojaImages(
  pooja: Pooja,
  language: PoojaLanguage,
): string[] {
  const localizedImages = cleanImageUrls(
    pooja.translations.find((translation) => translation.language === language)
      ?.imageUrls,
  );
  if (localizedImages.length > 0) return localizedImages;

  const englishImages = cleanImageUrls(
    pooja.translations.find((translation) => translation.language === "EN")
      ?.imageUrls,
  );
  if (englishImages.length > 0) return englishImages;

  return cleanImageUrls(pooja.imageUrls);
}
