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
import {
  POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE,
  POOJAS_PAGE_SIZE,
  POOJAS_SEARCH_DEBOUNCE_MS,
  type PoojasBrowserDbLanguage,
} from "@/constants/poojas-browser.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  getBenifitsApi,
  type Benifit,
  type BenifitTranslation,
} from "@/lib/api/benifit/benifits.api";
import {
  getTemplesApi,
  type Temple,
  type TempleTranslation,
} from "@/lib/api/temple/temples.api";
import type {
  Pooja,
  PoojasMeta,
  PoojaTranslation,
} from "@/lib/api/pooja/poojas.api";
import {
  getPoojasApi,
  type PoojaCategoryFilter,
} from "@/lib/api/pooja/poojas.api";
import { getErrorMessage } from "@/lib/utils";

type DbLanguage = PoojasBrowserDbLanguage;

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

function getDiscountedAmount(
  baseAmount: string | number,
  discount: number | null | undefined,
) {
  const amount = Number(baseAmount);
  const discountPercent = Number(discount ?? 0);

  if (!Number.isFinite(amount)) return baseAmount;
  if (!discountPercent) return amount;

  return Math.max(0, Math.round(amount - (amount * discountPercent) / 100));
}

function getPoojaDiscount(pooja: Pooja) {
  return pooja.isWeekly ? pooja.weeklyDiscount : pooja.normalDiscount;
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

type PoojasBrowserProps = {
  initialPoojas?: Pooja[];
  initialMeta?: PoojasMeta;
  initialTemples?: Temple[];
  initialBenifits?: Benifit[];
  initialError?: string;
};

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

export function PoojasBrowser({
  initialPoojas,
  initialMeta,
  initialTemples,
  initialBenifits,
  initialError = "",
}: PoojasBrowserProps) {
  const { language, t } = useLanguage();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasInitialPoojas = Boolean(initialPoojas?.length);
  const hasInitialOptions = Boolean(initialTemples?.length && initialBenifits?.length);
  const didUseInitialOptionsRef = useRef(hasInitialOptions);
  const didHydrateSearchRef = useRef(false);
  const [poojas, setPoojas] = useState<Pooja[]>(initialPoojas ?? []);
  const [temples, setTemples] = useState<Temple[]>(initialTemples ?? []);
  const [benifits, setBenifits] = useState<Benifit[]>(initialBenifits ?? []);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<PoojaCategoryFilter>("");
  const [templeId, setTempleId] = useState("");
  const [benifitId, setBenifitId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPoojas, setTotalPoojas] = useState(initialMeta?.total ?? 0);
  const [totalPages, setTotalPages] = useState(
    Math.max(1, initialMeta?.totalPages ?? 1),
  );
  const [isLoading, setIsLoading] = useState(!hasInitialPoojas);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(!hasInitialOptions);
  const [error, setError] = useState(initialError);


  useEffect(() => {
    if (!didHydrateSearchRef.current) {
      didHydrateSearchRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPoojas([]);
      setPage(1);
    }, POOJAS_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadOptions() {
      if (didUseInitialOptionsRef.current) {
        didUseInitialOptionsRef.current = false;
        return;
      }

      setIsLoadingOptions(true);

      try {
        const [templeResponse, benifitResponse] = await Promise.all([
          getTemplesApi({ limit: 100 }),
          getBenifitsApi({ limit: 100 }),
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
      const isInitialUnfilteredPage =
        page === 1 && !debouncedSearch && !category && !templeId && !benifitId;

      if (isInitialUnfilteredPage && hasInitialPoojas) return;

      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError("");

      try {
        const poojaResponse = await getPoojasApi({
          page,
          limit: POOJAS_PAGE_SIZE,
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
  }, [benifitId, category, debouncedSearch, hasInitialPoojas, page, templeId]);

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
  const isSearchPending = search.trim() !== debouncedSearch;
  const shouldRenderInitialPoojas =
    !isSearchPending &&
    page === 1 &&
    !debouncedSearch &&
    !category &&
    !templeId &&
    !benifitId &&
    hasInitialPoojas;
  const visiblePoojas = shouldRenderInitialPoojas ? (initialPoojas ?? []) : poojas;
  const visibleTotalPoojas = shouldRenderInitialPoojas
    ? (initialMeta?.total ?? visiblePoojas.length)
    : totalPoojas;
  const visibleStart = visibleTotalPoojas === 0 ? 0 : 1;
  const visibleEnd = Math.min(visiblePoojas.length, visibleTotalPoojas);
  const selectedDbLanguage = POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];

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
        <h1 className="text-wrap-safe text-[1.65rem] sm:text-4xl font-extrabold leading-[1.1] text-text-primary md:text-5xl">
          {t.poojasPage.titleStart}
          <span className="text-saffron">{t.poojasPage.titlePoojas}</span>
          {t.poojasPage.titleMiddle}
          <span className="text-saffron">{t.poojasPage.titleTemples}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl px-2 text-wrap-safe text-[13px] sm:text-sm font-semibold leading-5 sm:leading-6 text-text-primary/75">
          {t.poojasPage.description}
        </p>

        <div className="mx-auto mt-8 flex max-w-3xl flex-row items-center justify-between gap-2 sm:gap-3 rounded-lg border border-saffron/20 bg-[#fff8f2] px-3 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 text-left">
            <p className="text-[11px] sm:text-sm font-bold text-saffron">
              {t.poojasPage.guideSubtitle}
            </p>
            <h2 className="mt-0.5 sm:mt-1 text-wrap-safe text-[13px] sm:text-xl font-extrabold leading-[1.2] sm:leading-7 text-text-primary md:text-2xl">
              Know about how to book pooja on Yaagam
            </h2>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-9 sm:min-h-11 shrink-0 rounded-full px-3 sm:px-5 text-[11px] sm:text-sm font-extrabold">
                Watch guide
                <Play className="ml-1 h-3 w-3 sm:h-4 sm:w-4 fill-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto p-5 sm:p-7">
              <DialogHeader className="pr-8 text-left">
                <DialogTitle className="text-2xl leading-8 text-text-primary md:text-3xl">
                  {t.poojasPage.bookingStart}
                  <span className="text-saffron">{t.poojasPage.bookingHighlight}</span>
                  {t.poojasPage.bookingEnd}
                </DialogTitle>
              </DialogHeader>

              <div
                aria-label={t.poojasPage.guideAlt}
                className="group relative aspect-video w-full overflow-hidden rounded-lg bg-[#1d1107] shadow-[0_18px_35px_rgba(13,41,110,0.16)]"
              >
                <Image
                  src="/banner.png"
                  alt={t.poojasPage.guideAlt}
                  fill
                  className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute left-5 top-5 text-left">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-saffron">
                    {t.poojasPage.guideKicker}
                  </p>
                  <p className="mt-3 max-w-48 text-2xl font-extrabold uppercase leading-6 text-white">
                    {t.poojasPage.guideTitle}
                  </p>
                  <p className="mt-2 text-xs font-bold text-white/80">
                    {t.poojasPage.guideSubtitle}
                  </p>
                </div>
                <span className="absolute inset-0 m-auto flex h-11 w-14 items-center justify-center rounded-lg bg-red-600 text-white">
                  <Play className="ml-0.5 h-6 w-6 fill-white" />
                </span>
              </div>
            </DialogContent>
          </Dialog>
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

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex h-11 w-full items-center gap-2 rounded-lg border-black/10 text-sm font-extrabold text-text-primary lg:hidden"
              >
                <Filter className="h-4 w-4 text-saffron" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1.5 text-xs font-extrabold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6">
              <DialogHeader className="pr-8 text-left">
                <DialogTitle className="text-xl">Filters</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <section className="border-t border-black/10 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-text-primary">
                    <Filter className="h-4 w-4 text-saffron" />
                    Category
                  </div>
                  <label className="flex min-h-11 items-center rounded-lg border border-black/10 bg-white px-3">
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
                </section>

                <section className="border-t border-black/10 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-text-primary">
                    <Sparkles className="h-4 w-4 text-saffron" />
                    Benifits
                  </div>
                  <label className="flex min-h-11 items-center rounded-lg border border-black/10 bg-white px-3">
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
                </section>

                <section className="border-t border-black/10 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-text-primary">
                    <Landmark className="h-4 w-4 text-saffron" />
                    Temples
                  </div>
                  <label className="flex min-h-11 items-center rounded-lg border border-black/10 bg-white px-3">
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
                </section>
              </div>

              <div className="flex gap-3 border-t border-black/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={activeFilterCount === 0}
                  onClick={resetFilters}
                  className="h-11 flex-1 rounded-full border-yellow-600"
                >
                  Clear
                </Button>
                <DialogClose asChild>
                  <Button type="button" className="h-11 flex-1 rounded-full">
                    Apply
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <label className="hidden min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70 lg:flex">
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

          <label className="hidden min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70 lg:flex">
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

          <label className="hidden min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70 lg:flex">
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
            className="hidden rounded-full border-2 text-saffron border-saffron px-5 lg:inline-flex"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="mb-5 flex min-h-8 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-text-primary/60">
          Showing {visibleStart}-{visibleEnd} of {visibleTotalPoojas}
        </p>
        {isSearchPending && (
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching
          </span>
        )}
      </div>

      {isLoading && visiblePoojas.length === 0 ? (
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
      ) : visiblePoojas.length === 0 ? (
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
          {visiblePoojas.map((pooja) => {
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
                location={
                  temple
                    ? `${temple.name}, ${temple.place}`
                    : "Temple details"
                }
                price={formatAmount(getDiscountedAmount(pooja.baseAmount, getPoojaDiscount(pooja)))}
                originalPrice={formatAmount(pooja.baseAmount)}
                image={imageUrl}
                dayBadge={pooja.poojaDay}
                category={pooja.isWeekly ? "Weekly" : "Normal"}
                benifits={benifitNames}
                href={APP_ROUTES.poojaDetails(pooja.id)}
                templeHref={APP_ROUTES.templeDetails(pooja.temple.id)}
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
