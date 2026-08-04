"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower, Loader2, Play, Search } from "lucide-react";

import { PoojaCard } from "@/components/blocks/PoojaCard";
import { Button } from "@/components/ui/button";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { PoojasFilterDialog } from "@/components/blocks/PoojasFilterDialog";
import {
  POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE,
  POOJAS_PAGE_SIZE,
  POOJAS_SEARCH_DEBOUNCE_MS,
  type PoojasBrowserDbLanguage,
} from "@/constants/poojas-browser.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  Dialog,
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
import { useTypewriter } from "@/hooks/use-typewriter";

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

function getTempleLabel(temple: Temple, dbLanguage: DbLanguage) {
  const translation = temple.translations.find(
    (t) => t.language === dbLanguage,
  );
  return translation?.name || temple.translations[0]?.name || "Unknown Temple";
}

function getBenifitLabel(benifit: Benifit, language: DbLanguage) {
  return (
    getLocalizedTranslation<BenifitTranslation>(benifit.translations, language)
      ?.name ?? benifit.slug
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
    <div
      className="flex items-center justify-center gap-3"
      aria-label="Loading poojas"
    >
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
  const hasInitialOptions = Boolean(
    initialTemples?.length && initialBenifits?.length,
  );
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
  const [error, setError] = useState(initialError);

  const selectedDbLanguage =
    POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];

  const dynamicPlaceholders = useMemo(() => {
    const items: string[] = [];

    if (poojas && poojas.length > 0) {
      const poojaName = getLocalizedTranslation(
        poojas[0].translations,
        selectedDbLanguage,
      )?.name;
      if (poojaName) items.push(`Search for ${poojaName}`);
    }

    if (temples && temples.length > 0) {
      const templeName = getTempleLabel(temples[0], selectedDbLanguage);
      if (templeName) items.push(`Search for ${templeName}`);
    }

    if (benifits && benifits.length > 0) {
      const benefitName = getBenifitLabel(benifits[0], selectedDbLanguage);
      if (benefitName) items.push(`Search for ${benefitName}`);
    }

    if (items.length === 0) {
      items.push("Search for Mangal Dosh Nivaran");
      items.push("Search for Navagraha pooja");
      items.push("Search for weekly poojas");
    }

    return items;
  }, [poojas, temples, benifits, selectedDbLanguage]);

  const animatedPlaceholder = useTypewriter(dynamicPlaceholders);

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

      try {
        const [templeResponse, benifitResponse] = await Promise.all([
          getTemplesApi({ limit: 100 }),
          getBenifitsApi({ limit: 100 }),
        ]);

        if (!isActive) return;

        setTemples(templeResponse.items);
        setBenifits(benifitResponse.items);
      } finally {
        // Options loading finished
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
          templeSlug: templeId,
          benefitSlug: benifitId,
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
  const visiblePoojas = shouldRenderInitialPoojas
    ? (initialPoojas ?? [])
    : poojas;
  const visibleTotalPoojas = shouldRenderInitialPoojas
    ? (initialMeta?.total ?? visiblePoojas.length)
    : totalPoojas;
  const visibleStart = visibleTotalPoojas === 0 ? 0 : 1;
  const visibleEnd = Math.min(visiblePoojas.length, visibleTotalPoojas);

  function resetResults() {
    setPoojas([]);
    setPage(1);
  }

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="bg-[#fff8f2]">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 text-center md:px-8 lg:pb-10 lg:pt-14">
          <div className="mx-auto mb-6 flex max-w-2xl flex-row items-center justify-between gap-2 sm:gap-3 rounded-lg border border-saffron/20 bg-white px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm">
            <div className="min-w-0 text-left">
              <p className="text-[10px] sm:text-xs font-bold text-saffron">
                {t.poojasPage.guideSubtitle}
              </p>
              <h2 className="mt-0.5 text-wrap-safe text-xs sm:text-base font-extrabold leading-[1.2] sm:leading-snug text-text-primary md:text-lg">
                Know about how to book pooja on Yaagam
              </h2>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-8 sm:min-h-9 shrink-0 rounded-full px-3 sm:px-4 text-[10px] sm:text-xs font-extrabold">
                  Watch guide
                  <Play className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto p-5 sm:p-7">
                <DialogHeader className="pr-8 text-left">
                  <DialogTitle className="text-2xl leading-8 text-text-primary md:text-3xl">
                    {t.poojasPage.bookingStart}
                    <span className="text-saffron">
                      {t.poojasPage.bookingHighlight}
                    </span>
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
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {t.poojasPage.titleStart}
            <span className="text-saffron">{t.poojasPage.titlePoojas}</span>
            {t.poojasPage.titleMiddle}
            <span className="text-saffron">{t.poojasPage.titleTemples}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-text-primary/65 md:text-base md:leading-7">
            {t.poojasPage.description}
          </p>
          <div className="mx-auto mt-7 flex min-h-13 max-w-2xl items-center gap-3 text-left">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-black/10 bg-white px-4 shadow-sm">
              <Search className="h-5 w-5 shrink-0 text-saffron" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={animatedPlaceholder}
                className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-text-primary outline-none placeholder:text-text-primary/40"
              />
            </label>
            <PoojasFilterDialog
              activeCategory={category}
              activeBenifitId={benifitId}
              activeTempleId={templeId}
              benifits={benifits}
              temples={temples}
              selectedDbLanguage={selectedDbLanguage}
              getBenifitLabel={getBenifitLabel}
              getTempleLabel={getTempleLabel}
              activeFilterCount={activeFilterCount}
              onApply={(newCategory, newBenifitId, newTempleId) => {
                setCategory(newCategory);
                setBenifitId(newBenifitId);
                setTempleId(newTempleId);
                resetResults();
              }}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">

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
        <motion.div
          layout
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
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
                <motion.div
                  key={pooja.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <PoojaCard
                    title={primary?.name ?? "Untitled pooja"}
                    location={
                      temple
                        ? `${temple.name}, ${temple.place}`
                        : "Temple details"
                    }
                    price={formatAmount(
                      getDiscountedAmount(
                        pooja.baseAmount,
                        getPoojaDiscount(pooja),
                      ),
                    )}
                    originalPrice={formatAmount(pooja.baseAmount)}
                    image={imageUrl}
                    dayBadge={pooja.poojaDay}
                    category={pooja.isWeekly ? "Weekly" : "Normal"}
                    benifits={benifitNames}
                    href={APP_ROUTES.poojaDetails(pooja.slug)}
                    templeHref={APP_ROUTES.templeDetails(pooja.temple.slug)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}


      <div ref={loadMoreRef} className="min-h-16 pt-8">
        {isLoadingMore && <LoadingDots />}
      </div>
      <BackToTopButton />
      </section>
    </main>
  );
}
