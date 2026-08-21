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
      <DialogContent className="max-w-lg overflow-hidden p-5 sm:p-7">
        <DialogHeader className="items-center pr-7">
          <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-saffron/10 text-saffron">
            <Languages className="h-6 w-6" />
          </span>
          <DialogTitle>Choose your language</DialogTitle>
          <DialogDescription className="max-w-sm">
            Select the language you&apos;re most comfortable with. These five
            languages are currently available on Yaagam.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  "group relative flex min-h-32 flex-col items-center justify-center rounded-2xl border bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-saffron hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2",
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
                    "flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-bold text-text-primary transition group-hover:scale-105",
                    option.ring,
                  )}
                >
                  {option.symbol}
                </span>
                <span className="mt-2 text-sm font-bold text-text-primary">
                  {option.nativeName}
                </span>
                {option.nativeName !== option.englishName && (
                  <span className="mt-0.5 text-[11px] font-medium text-text-primary/50">
                    {option.englishName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs font-medium text-text-primary/50">
          You can change this anytime from the language menu.
        </p>
      </DialogContent>
    </Dialog>
  );
}
