import type { PoojaTranslation } from "@/lib/api/pooja/poojas.api";
import type { Language } from "@/translations/locales";

export type PoojasBrowserDbLanguage = PoojaTranslation["language"];

export const POOJAS_SEARCH_DEBOUNCE_MS = 350;

export const POOJAS_PAGE_SIZE = 12;

export const POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE: Record<
  Language,
  PoojasBrowserDbLanguage
> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};