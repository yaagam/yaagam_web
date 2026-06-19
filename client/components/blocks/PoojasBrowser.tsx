"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Filter,
  Flower,
  Landmark,
  Loader2,
  Play,
  Search,
  Sparkles,
} from "lucide-react";

import { PoojaCard } from "@/components/blocks/PoojaCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  getAdminBenifitsApi,
  type Benifit,
  type BenifitTranslation,
} from "@/lib/api/admin/benifit/benifits.api";
import {
  getAdminTemplesApi,
  type Temple,
  type TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import {
  getPoojasApi,
  type PoojaCategoryFilter,
} from "@/lib/api/pooja/poojas.api";
import type { Language } from "@/lib/i18n/translations";
import { getErrorMessage } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 12;
type DbLanguage = PoojaTranslation["language"];

const dbLanguageByUiLanguage: Record<Language, DbLanguage> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};

function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[],
  language: DbLanguage,
) {
  return (
    translations.find((translation) => translation.language === language) ??
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTempleLabel(temple: Temple, language: DbLanguage) {
  const primary = getLocalizedTranslation<TempleTranslation>(
    temple.translations,
    language,
  );

  return primary ? `${primary.name}, ${primary.place}` : temple.id;
}

function getBenifitLabel(benifit: Benifit, language: DbLanguage) {
  return (
    getLocalizedTranslation<BenifitTranslation>(benifit.translations, language)
      ?.name ?? benifit.id
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-3" aria-label="Loading poojas">
      {[0, 1, 2, 3].map((dot) => (
        <span
          key={dot}
          className="h-3 w-3 animate-pulse rounded-full bg-saffron"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function PoojasBrowser() {
  const { language } = useLanguage();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [benifits, setBenifits] = useState<Benifit[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<PoojaCategoryFilter>("");
  const [templeId, setTempleId] = useState("");
  const [benifitId, setBenifitId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPoojas, setTotalPoojas] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPoojas([]);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [templeResponse, benifitResponse] = await Promise.all([
          getAdminTemplesApi({ limit: 100 }),
          getAdminBenifitsApi({ limit: 100 }),
        ]);

        if (!isActive) return;

        setTemples(templeResponse.items);
        setBenifits(benifitResponse.items);
      } finally {
        if (isActive) setIsLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPoojas() {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError("");

      try {
        const poojaResponse = await getPoojasApi({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          category,
          templeId,
          benifitId,
        });

        if (!isActive) return;

        setPoojas((current) =>
          page === 1
            ? poojaResponse.items
            : [...current, ...poojaResponse.items],
        );
        setTotalPoojas(poojaResponse.meta.total);
        setTotalPages(Math.max(1, poojaResponse.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;

        setError(getErrorMessage(loadError, "Unable to load poojas."));
        setPoojas([]);
        setTotalPoojas(0);
        setTotalPages(1);
      } finally {
        if (isActive) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    void loadPoojas();

    return () => {
      isActive = false;
    };
  }, [benifitId, category, debouncedSearch, page, templeId]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          page < totalPages
        ) {
          setPage((current) => Math.min(totalPages, current + 1));
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, page, totalPages]);

  const activeFilterCount = useMemo(
    () => [category, templeId, benifitId].filter(Boolean).length,
    [benifitId, category, templeId],
  );
  const visibleStart = totalPoojas === 0 ? 0 : 1;
  const visibleEnd = Math.min(poojas.length, totalPoojas);
  const isSearchPending = search.trim() !== debouncedSearch;
  const selectedDbLanguage = dbLanguageByUiLanguage[language];

  function resetFilters() {
    setCategory("");
    setTempleId("");
    setBenifitId("");
    setPoojas([]);
    setPage(1);
  }

  function resetResults() {
    setPoojas([]);
    setPage(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto mb-12 max-w-4xl text-center">
        <h1 className="text-wrap-safe text-4xl font-extrabold leading-[1.05] text-text-primary md:text-5xl">
          Book <span className="text-saffron">Sacred Poojas</span> at India&apos;s{" "}
          <span className="text-saffron">Holiest Temples</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-wrap-safe text-sm font-semibold leading-6 text-text-primary/75">
          Choose from the best authentic Vedic rituals performed by qualified
          pandits at renowned temples across India.
        </p>

        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-2xl font-extrabold leading-8 text-text-primary md:text-3xl">
            How to <span className="text-saffron">Book Pooja</span> on Yaagam?
          </h2>
          <button
            type="button"
            aria-label="Play pooja booking guide"
            className="group relative mx-auto mt-7 block aspect-video w-full max-w-md overflow-hidden rounded-sm bg-[#1d1107] shadow-[0_18px_35px_rgba(13,41,110,0.16)]"
          >
            <Image
              src="/banner.png"
              alt="How to book pooja guide"
              fill
              className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute left-5 top-5 text-left">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-saffron">
                Yaagam
              </p>
              <p className="mt-3 max-w-48 text-2xl font-extrabold uppercase leading-6 text-white">
                How to Book Pooja
              </p>
              <p className="mt-2 text-xs font-bold text-white/80">
                A Step-by-Step Guide
              </p>
            </div>
            <span className="absolute inset-0 m-auto flex h-11 w-14 items-center justify-center rounded-lg bg-red-600 text-white">
              <Play className="ml-0.5 h-6 w-6 fill-white" />
            </span>
          </button>
        </div>
      </div>

      <div className="mb-6 border-y border-black/10 bg-white py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_220px_auto] lg:items-center">
          <label className="relative block min-w-0">
            <span className="sr-only">Search poojas</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pooja, temple, or day"
              className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
            />
          </label>

          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70">
            <Filter className="h-4 w-4 text-saffron" />
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as PoojaCategoryFilter);
                resetResults();
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-text-primary outline-none"
            >
              <option value="">All categories</option>
              <option value="normal">Normal</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>

          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70">
            <Sparkles className="h-4 w-4 text-saffron" />
            <select
              value={benifitId}
              disabled={isLoadingOptions}
              onChange={(event) => {
                setBenifitId(event.target.value);
                resetResults();
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-text-primary outline-none disabled:opacity-60"
            >
              <option value="">All benifits</option>
              {benifits.map((benifit) => (
                <option key={benifit.id} value={benifit.id}>
                  {getBenifitLabel(benifit, selectedDbLanguage)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70">
            <Landmark className="h-4 w-4 text-saffron" />
            <select
              value={templeId}
              disabled={isLoadingOptions}
              onChange={(event) => {
                setTempleId(event.target.value);
                resetResults();
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-text-primary outline-none disabled:opacity-60"
            >
              <option value="">All temples</option>
              {temples.map((temple) => (
                <option key={temple.id} value={temple.id}>
                  {getTempleLabel(temple, selectedDbLanguage)}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            disabled={activeFilterCount === 0}
            onClick={resetFilters}
            className="border-yellow-600 rounded-full px-5"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="mb-5 flex min-h-8 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-text-primary/60">
          Showing {visibleStart}-{visibleEnd} of {totalPoojas}
        </p>
        {isSearchPending && (
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-96 flex-col items-center justify-center gap-3 py-16 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-saffron" />
          <p className="text-sm font-bold text-text-primary/65">
            Loading poojas
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-96 flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-lg font-extrabold text-text-primary">
            Could not load poojas
          </p>
          <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
        </div>
      ) : poojas.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center gap-3 py-16 text-center">
          <Flower className="h-9 w-9 text-text-primary/35" />
          <p className="text-lg font-extrabold text-text-primary">
            No poojas found
          </p>
          <p className="max-w-md text-sm leading-6 text-text-primary/60">
            Try a different search term, benifit, temple, or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {poojas.map((pooja) => {
            const primary = getLocalizedTranslation<PoojaTranslation>(
              pooja.translations,
              selectedDbLanguage,
            );
            const temple = getLocalizedTranslation<TempleTranslation>(
              pooja.temple.translations,
              selectedDbLanguage,
            );
            const imageUrl = pooja.imageUrls?.[0] ?? "/chandra_graha.png";
            const benifitNames = pooja.benefits
              .map((benifit) => getBenifitLabel(benifit, selectedDbLanguage))
              .slice(0, 3);

            return (
              <PoojaCard
                key={pooja.id}
                title={primary?.name ?? "Untitled pooja"}
                about={primary?.about}
                location={
                  temple
                    ? `${temple.name}, ${temple.place}`
                    : "Temple details"
                }
                price={formatAmount(pooja.baseAmount)}
                image={imageUrl}
                dayBadge={pooja.poojaDay}
                category={pooja.isWeekly ? "Weekly" : "Normal"}
                benifits={benifitNames}
              />
            );
          })}
        </div>
      )}

      <div ref={loadMoreRef} className="min-h-16 pt-8">
        {isLoadingMore && <LoadingDots />}
      </div>
    </section>
  );
}
