export const languages = ["en", "ml", "hi", "mr", "ta"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "en";

export const languageNames: Record<Language, string> = {
  en: "English",
  mr: "\u092e\u0930\u093e\u0920\u0940",
  ta: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",
  ml: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02",
  hi: "\u0939\u093f\u0928\u094d\u0926\u0940",
};

export function isLanguage(value: string): value is Language {
  return languages.includes(value as Language);
}

export function getLanguagePrefix(language: Language) {
  return language === defaultLanguage ? "" : `/${language}`;
}

export function stripLocalePrefix(pathname: string) {
  const locale = languages.find(
    (language) =>
      pathname === `/${language}` || pathname.startsWith(`/${language}/`),
  );

  if (!locale) return { language: null, pathnameWithoutLocale: pathname };

  const prefix = `/${locale}`;
  return {
    language: locale,
    pathnameWithoutLocale: pathname.slice(prefix.length) || "/",
  };
}

export function localizePath(pathname: string, language: Language) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { pathnameWithoutLocale } = stripLocalePrefix(normalizedPathname);
  const prefix = getLanguagePrefix(language);

  return `${prefix}${pathnameWithoutLocale === "/" ? "" : pathnameWithoutLocale}` || "/";
}