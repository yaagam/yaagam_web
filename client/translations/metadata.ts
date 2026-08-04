import type { Metadata } from "next";

import {
  defaultLanguage,
  languages,
  localizePath,
  type Language,
} from "@/translations/locales";

const productionSiteUrl = "https://www.yaagam.in";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    productionSiteUrl;
  const url = new URL(configuredUrl);

  if (url.hostname === "yaagam.in") {
    url.hostname = "www.yaagam.in";
  }

  return url.origin;
}

const siteUrl = getSiteUrl();

export function getPublicUrl(pathname: string, language: Language) {
  return new URL(localizePath(pathname, language), siteUrl).toString();
}

export function getLanguageAlternates(pathname: string) {
  return Object.fromEntries(
    languages.map((language) => [language, getPublicUrl(pathname, language)]),
  ) as Record<Language, string>;
}

export function getSeoAlternates(
  pathname: string,
  language: Language = defaultLanguage,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: getPublicUrl(pathname, language),
    languages: {
      ...getLanguageAlternates(pathname),
      "x-default": getPublicUrl(pathname, defaultLanguage),
    },
  };
}