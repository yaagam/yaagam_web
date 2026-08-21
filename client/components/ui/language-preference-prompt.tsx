"use client";

import { Check, Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguagePreferenceStore } from "@/lib/language-preference.store";
import { cn } from "@/lib/utils";
import {
  languages,
  localizePath,
  type Language,
} from "@/translations/locales";

const languageOptions: Record<
  Language,
  { symbol: string; nativeName: string; englishName: string; ring: string }
> = {
  en: {
    symbol: "A",
    nativeName: "English",
    englishName: "English",
    ring: "border-saffron",
  },
  ml: {
    symbol: "മ",
    nativeName: "മലയാളം",
    englishName: "Malayalam",
    ring: "border-emerald-500",
  },
  hi: {
    symbol: "हि",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    ring: "border-amber-500",
  },
  mr: {
    symbol: "म",
    nativeName: "मराठी",
    englishName: "Marathi",
    ring: "border-violet-600",
  },
  ta: {
    symbol: "த",
    nativeName: "தமிழ்",
    englishName: "Tamil",
    ring: "border-blue-600",
  },
};

export function LanguagePreferencePrompt() {
  const { language, setLanguage } = useLanguage();
  const selectedLanguage = useLanguagePreferenceStore(
    (state) => state.selectedLanguage,
  );
  const hasHydrated = useLanguagePreferenceStore((state) => state.hasHydrated);
  const setSelectedLanguage = useLanguagePreferenceStore(
    (state) => state.setSelectedLanguage,
  );
  const pathname = usePathname();
  const router = useRouter();
  const appliedStoredLanguageRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    void useLanguagePreferenceStore.persist.rehydrate();
  }, []);

  const navigateToLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    const nextPath = localizePath(pathname, nextLanguage);
    const query = new URLSearchParams(window.location.search).toString();
    router.replace(query ? `${nextPath}?${query}` : nextPath, {
      scroll: false,
    });
  }, [pathname, router, setLanguage]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !selectedLanguage ||
      appliedStoredLanguageRef.current
    ) {
      return;
    }

    appliedStoredLanguageRef.current = true;
    navigateToLanguage(selectedLanguage);
  }, [hasHydrated, navigateToLanguage, selectedLanguage]);

  function chooseLanguage(nextLanguage: Language) {
    setSelectedLanguage(nextLanguage);
    setDismissed(true);
    navigateToLanguage(nextLanguage);
  }

  const open = hasHydrated && !selectedLanguage && !dismissed;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setDismissed(!nextOpen)}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm gap-3 overflow-hidden p-4 sm:max-w-lg sm:gap-4 sm:p-7">
        <DialogHeader className="items-center pr-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/10 text-saffron sm:mb-1 sm:h-12 sm:w-12">
            <Languages className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <DialogTitle className="text-xl sm:text-2xl">
            Choose your language
          </DialogTitle>
          <DialogDescription className="max-w-sm text-xs leading-5 sm:text-sm sm:leading-6">
            Select the language you&apos;re most comfortable with. These five
            languages are currently available on Yaagam.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {languages.map((item) => {
            const option = languageOptions[item];
            const selected = item === language;

            return (
              <button
                key={item}
                type="button"
                onClick={() => chooseLanguage(item)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex min-h-24 flex-col items-center justify-center rounded-xl border bg-white px-1.5 py-2.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-saffron hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 sm:min-h-32 sm:rounded-2xl sm:px-3 sm:py-4",
                  selected
                    ? "border-saffron bg-saffron/5"
                    : "border-black/10",
                )}
              >
                {selected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-saffron text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 text-xl font-bold text-text-primary transition group-hover:scale-105 sm:h-14 sm:w-14 sm:text-2xl",
                    option.ring,
                  )}
                >
                  {option.symbol}
                </span>
                <span className="mt-1.5 text-xs font-bold leading-4 text-text-primary sm:mt-2 sm:text-sm">
                  {option.nativeName}
                </span>
                {option.nativeName !== option.englishName && (
                  <span className="mt-0.5 hidden text-[11px] font-medium text-text-primary/50 sm:block">
                    {option.englishName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] font-medium leading-4 text-text-primary/50 sm:text-xs">
          You can change this anytime from the language menu.
        </p>
      </DialogContent>
    </Dialog>
  );
}
