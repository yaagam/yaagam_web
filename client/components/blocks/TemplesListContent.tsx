"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import { ArrowRight, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE } from "@/constants/poojas-browser.const";
import { APP_ROUTES } from "@/constants/route.const";
import { getTemplesApi } from "@/lib/api/temple/temples.api";
import type {
  Temple,
  TempleTranslation,
} from "@/lib/api/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";
import { useTypewriter } from "@/hooks/use-typewriter";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { OmPattern } from "@/components/ui/om-pattern";

type TemplesListContentProps = {
  temples?: Temple[];
};

const pageCopy = {
  title: "Temples of Bharat",
  description:
    "Explore sacred temples, their places, traditions, and available poojas on Yaagam.",
  search: "Search for temples, places, districts",
  badge: "Temples of Bharat",
  read: "Read more",
  readTime: "min read",
  noTemples: "No temples available",
  noTemplesText: "Temples will appear here once they are added.",
  noResults: "No matching temples found.",
  loading: "Loading temples",
  errorTitle: "Could not load temples",
};

function getLocalizedTempleTranslation(
  temple: Temple,
  language: TempleTranslation["language"],
) {
  return (
    temple.translations.find((translation) => translation.language === language) ??
    temple.translations.find((translation) => translation.language === "EN") ??
    temple.translations[0] ??
    null
  );
}

function templeMatches(
  temple: Temple,
  translation: TempleTranslation | null,
  query: string,
) {
  if (!query.trim()) return true;

  const haystack = [
    translation?.name,
    translation?.place,
    translation?.district,
    translation?.description,
    temple.state,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function getDateLabel(value: string | null | undefined) {
  if (!value) return "Yaagam";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yaagam";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getReadTime(translation: TempleTranslation | null) {
  const length = [translation?.name, translation?.description]
    .filter(Boolean)
    .join(" ").length;

  return Math.max(3, Math.min(8, Math.ceil(length / 900) + 2));
}

export function TemplesListContent({
  temples: initialTemples = [],
}: TemplesListContentProps) {
  const { language } = useLanguage();
  const selectedDbLanguage = POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const [temples, setTemples] = useState(initialTemples);
  const [isLoading, setIsLoading] = useState(initialTemples.length === 0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (initialTemples.length > 0) return;

    let isActive = true;

    async function loadTemples() {
      setIsLoading(true);
      setError("");

      try {
        const templesResponse = await getTemplesApi({ limit: 100 });
        if (isActive) setTemples(templesResponse.items);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load temples."));
          setTemples([]);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadTemples();

    return () => {
      isActive = false;
    };
  }, [initialTemples.length]);

  const templesWithTranslations = useMemo(
    () =>
      temples.map((temple) => ({
        temple,
        translation: getLocalizedTempleTranslation(temple, selectedDbLanguage),
      })),
    [temples, selectedDbLanguage],
  );
  const visibleTemples = useMemo(
    () =>
      templesWithTranslations.filter(({ temple, translation }) =>
        templeMatches(temple, translation, query),
      ),
    [templesWithTranslations, query],
  );

  const dynamicPlaceholders = useMemo(() => {
    const items: string[] = [];

    if (temples && temples.length > 0) {
      // Pick some temples to show
      const sampleSize = Math.min(3, temples.length);
      for (let i = 0; i < sampleSize; i++) {
        const templeName = getLocalizedTempleTranslation(temples[i], selectedDbLanguage)?.name;
        if (templeName) items.push(`Search for ${templeName}`);
      }
    }

    if (items.length === 0) {
      items.push(pageCopy.search);
      items.push("Search for Kerala temples");
      items.push("Search by district or place");
    }

    return items;
  }, [temples, selectedDbLanguage]);

  const animatedPlaceholder = useTypewriter(dynamicPlaceholders);

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="relative isolate overflow-hidden bg-[#fff8e8]">
        <OmPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-10 text-center md:px-8 lg:pb-10 lg:pt-14">
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {pageCopy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-text-primary/65 md:text-base md:leading-7">
            {pageCopy.description}
          </p>
          <label className="mx-auto mt-7 flex min-h-13 max-w-2xl items-center gap-3 rounded-full border border-black/10 bg-white px-4 text-left shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-saffron" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={animatedPlaceholder}
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-primary/40"
            />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-12">
        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-saffron" />
            <p className="text-sm font-medium text-text-primary/65">
              {pageCopy.loading}
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <p className="text-lg font-extrabold text-text-primary">
              {pageCopy.errorTitle}
            </p>
            <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
          </div>
        ) : temples.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <PublicSvgIcon name="temple" width={36} height={36} className="h-9 w-9 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron" />
            <p className="mt-3 text-lg font-extrabold text-text-primary">
              {pageCopy.noTemples}
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
              {pageCopy.noTemplesText}
            </p>
          </div>
        ) : visibleTemples.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 bg-[#f8fafc] px-4 py-10 text-center text-sm font-medium text-text-primary/55">
            {pageCopy.noResults}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            {visibleTemples.map(({ temple, translation }) => {
              const name = translation?.name ?? "Temple";
              const place = [translation?.place, translation?.district, temple.state]
                .filter(Boolean)
                .join(", ");
              const imageUrl = temple.imageUrl || "/banner.png";

              return (
                <article
                  key={temple.slug}
                  className="flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
                >
                  <Link
                    href={APP_ROUTES.templeDetails(temple.slug)}
                    className="block shrink-0 sm:w-2/5"
                    aria-label={`View ${name}`}
                  >
                    <div className="relative aspect-[1.18] overflow-hidden bg-[#f8fafc] sm:h-full sm:aspect-auto">
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="(min-width: 1280px) 390px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-saffron shadow-sm">
                        {pageCopy.badge}
                      </span>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h2 className="line-clamp-2 text-base font-semibold leading-6 text-text-primary">
                        {name}
                      </h2>
                      <p className="mt-2 text-xs font-medium leading-5 text-text-primary/55">
                        {getReadTime(translation)} {pageCopy.readTime} - {getDateLabel(temple.createdAt)}
                      </p>
                      {place && (
                        <p className="mt-2 flex items-start gap-2 text-xs font-medium leading-5 text-text-primary/55">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
                          <span className="line-clamp-2">{place}</span>
                        </p>
                      )}
                      {translation?.description && (
                        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-text-primary/60">
                          {translation.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <Link
                        href={APP_ROUTES.templeDetails(temple.slug)}
                        className="mt-4 inline-flex items-center text-sm font-semibold text-saffron transition-colors hover:text-[#d96e13] hover:underline underline-offset-4"
                      >
                        {pageCopy.read}
                        <ArrowRight className="motion-arrow-right ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <BackToTopButton />
    </main>
  );
}

