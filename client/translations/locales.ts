export const languages = ["en", "ml", "hi", "mr", "ta"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "en";

export const languageNames: Record<Language, string> = {
  en: "English",
  mr: "मराठी",
  ta: "தமிழ்",
  ml: "മലയാളം",
  hi: "हिन्दी",
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