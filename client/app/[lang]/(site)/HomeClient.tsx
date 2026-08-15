"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { HeroSection } from "@/components/blocks/HeroSection";
import { PoojaCard } from "@/components/blocks/PoojaCard";
import { TestimonialCard } from "@/components/blocks/TestimonialCard";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import Image from "next/image";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  PackageCheck,
  Play,
  Star,
} from "lucide-react";
import {
  DAY_INDEX_BY_NAME,
  DEVOTEE_AVATAR_URLS,
  GUIDE_ICONS,
  HOME_DB_LANGUAGE_BY_UI_LANGUAGE,
  TESTIMONIALS,
  UPCOMING_POOJAS_LIMIT,
  type HomeDbLanguage,
} from "@/constants/home-page.const";
import { APP_ROUTES } from "@/constants/route.const";
import type { Benifit } from "@/lib/api/benifit/benifits.api";
import type { Pooja } from "@/lib/api/pooja/poojas.api";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { useLanguage } from "@/components/providers/LanguageProvider";

type DbLanguage = HomeDbLanguage;

function splitDevoteeLabel(label: string) {
  const match = label.match(/^([\d,]+\+?)\s*(.*)$/);
  return {
    suffix: match?.[2] || "devotees",
  };
}

function AnimatedDevoteeCount({
  label,
  isActive,
}: {
  label: string;
  isActive: boolean;
}) {
  const [count, setCount] = useState(0);
  const { suffix } = splitDevoteeLabel(label);

  useEffect(() => {
    if (!isActive) return;

    const duration = 2400;
    const target = 10000;
    let animationFrame = 0;
    const startedAt = performance.now();

    function update(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    }

    animationFrame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrame);
  }, [isActive]);

  return (
    <span
      className={`block text-wrap-safe text-4xl font-extrabold leading-none text-text-primary transition-transform duration-700 ease-out sm:text-5xl md:text-6xl ${
        isActive ? "scale-100" : "scale-90"
      }`}
    >
      {new Intl.NumberFormat("en-IN").format(count)}+
      <span className="ml-2 align-middle text-xl font-extrabold text-text-primary sm:text-2xl md:text-3xl">
        {suffix}
      </span>
    </span>
  );
}
function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[] | undefined,
  language: DbLanguage,
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0]
  );
}
function formatAmount(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}
function getNextPoojaDayDistance(dayName: string, today = new Date()) {
  const targetDay = DAY_INDEX_BY_NAME[dayName.trim().toLowerCase()];
  if (targetDay === undefined) return Number.MAX_SAFE_INTEGER;
  return (targetDay - today.getDay() + 7) % 7;
}
function getBenifitLabel(benifit: Benifit, language: DbLanguage) {
  const translation = getLocalizedTranslation(benifit.translations, language);
  return translation?.name;
}
function getUpcomingPoojas(poojas: Pooja[]) {
  return [...poojas]
    .sort((first, second) => {
      const dayDistance =
        getNextPoojaDayDistance(first.poojaDay) -
        getNextPoojaDayDistance(second.poojaDay);
      if (dayDistance !== 0) return dayDistance;
      return first.createdAt.localeCompare(second.createdAt);
    })
    .slice(0, UPCOMING_POOJAS_LIMIT);
}

function renderHeading(title: string, eyebrow: string) {
  const parts = title.split(/\*(.*?)\*/g);
  const formattedTitle = parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-saffron">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
  return (
    <>
      <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-[#0a3070] md:text-4xl">
        {formattedTitle}
      </h2>
      <p className="mt-2 text-wrap-safe text-base font-medium text-[#507ea2]">
        {eyebrow}
      </p>
    </>
  );
}

export default function HomeClient({
  initialPoojas = [],
}: {
  initialPoojas?: Pooja[];
}) {
  const { language, t } = useLanguage();
  const [poojas, setPoojas] = useState<Pooja[]>(initialPoojas);
  const devoteeStatsRef = useRef<HTMLDivElement>(null);
  const testimonialSectionRef = useRef<HTMLElement>(null);
  const testimonialTrackRef = useRef<HTMLDivElement>(null);
  const isTestimonialSectionInView = useInView(testimonialSectionRef, {
    amount: 0.75,
  });
  const popularPoojaTrackRef = useRef<HTMLDivElement>(null);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [isLoadingPoojas, setIsLoadingPoojas] = useState(
    initialPoojas.length === 0,
  );
  const [hasDevoteeStatsStarted, setHasDevoteeStatsStarted] = useState(false);
  const selectedDbLanguage = HOME_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const upcomingPoojas = useMemo(() => getUpcomingPoojas(poojas), [poojas]);
  useEffect(() => {
    const target = devoteeStatsRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasDevoteeStatsStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (initialPoojas.length > 0) return;

    let isActive = true;
    async function loadUpcomingPoojas() {
      setIsLoadingPoojas(true);
      try {
        const response = await getPoojasApi({ page: 1, limit: 100 });
        if (isActive) setPoojas(response.items);
      } catch {
        // Keep any poojas already available instead of clearing the section.
      } finally {
        if (isActive) setIsLoadingPoojas(false);
      }
    }
    void loadUpcomingPoojas();
    return () => {
      isActive = false;
    };
  }, [initialPoojas.length]);

  const scrollTestimonials = useCallback(() => {
    const track = testimonialTrackRef.current;
    if (!track) return;

    const firstCard = track.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = (firstCard?.offsetWidth ?? track.clientWidth) + gap;
    const isAtEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;

    track.scrollTo({
      left: isAtEnd ? 0 : track.scrollLeft + step,
      behavior: "smooth",
    });
  }, []);
  const scrollPopularPoojas = useCallback(() => {
    const track = popularPoojaTrackRef.current;
    if (!track) return;

    const firstCard = track.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = (firstCard?.offsetWidth ?? track.clientWidth / 2) + gap;
    const isAtEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;

    track.scrollTo({
      left: isAtEnd ? 0 : track.scrollLeft + step,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (
      isTestimonialPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(scrollTestimonials, 4500);
    return () => window.clearInterval(interval);
  }, [
    isTestimonialPaused,
    isTestimonialSectionInView,
    scrollTestimonials,
  ]);
  return (
    <div className="flex w-full flex-col pb-10">
      <HeroSection />

      <section
        aria-label={t.home.trustLabel}
        className="border-b border-saffron/20 bg-white"
      >
        <div className="container mx-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div
              ref={devoteeStatsRef}
              className="mb-5 flex flex-col items-center gap-3"
            >
              <div
                className="flex max-w-full justify-center -space-x-2 overflow-hidden sm:-space-x-2.5"
                onContextMenu={(event) => event.preventDefault()}
              >
                {DEVOTEE_AVATAR_URLS.map((avatarUrl, index) => (
                  <Image
                    key={avatarUrl}
                    src={avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    draggable={false}
                    className={`h-8 w-8 select-none rounded-full border-2 border-white object-cover shadow-md shadow-black/10 transition-all duration-400 ease-out sm:h-9 sm:w-9 md:h-10 md:w-10 ${
                      hasDevoteeStatsStarted
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-2 scale-75 opacity-0"
                    }`}
                    style={{
                      zIndex: DEVOTEE_AVATAR_URLS.length - index,
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <AnimatedDevoteeCount
                  label={t.home.devotees}
                  isActive={hasDevoteeStatsStarted}
                />
                <span className="mt-2 block text-wrap-safe text-sm font-semibold leading-5 text-text-primary/65 md:text-base">
                  {t.home.devoteesSub}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-lg border border-saffron/20 bg-saffron/5"
            >
              <div className="group flex min-w-0 min-h-24 flex-col items-center justify-center gap-1.5 border-r border-saffron/15 px-2 py-3 text-center transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/70 sm:min-h-28 sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:px-5 sm:py-5 sm:text-center">
                <Star className="h-6 w-6 shrink-0 fill-saffron text-saffron transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7" />
                <div className="min-w-0">
                  <strong className="block text-wrap-safe text-[13px] leading-4.5 text-text-primary sm:text-lg sm:leading-6">
                    {t.home.rating}
                  </strong>
                  <span className="mt-1 block text-wrap-safe text-[11px] leading-4 text-text-primary/65 sm:mt-0 sm:text-sm sm:leading-5">
                    {t.home.ratingSub}
                  </span>
                </div>
              </div>
              <div className="group flex min-w-0 min-h-24 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/70 sm:min-h-28 sm:flex-col sm:items-center sm:justify-center sm:gap-2 sm:px-5 sm:py-5 sm:text-center">
                <PackageCheck className="h-6 w-6 shrink-0 text-green-600 transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7" />
                <div className="min-w-0">
                  <strong className="block text-wrap-safe text-[13px] leading-4.5 text-text-primary sm:text-lg sm:leading-6">
                    {t.home.prasad}
                  </strong>
                  <span className="mt-1 block text-wrap-safe text-[11px] leading-4 text-text-primary/65 sm:mt-0 sm:text-sm sm:leading-5">
                    {t.home.prasadSub}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="upcoming-poojas"
        className="container mx-auto mt-8 px-4 md:mt-10 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-3"
        >
          <div className="min-w-0">
            {renderHeading(t.home.upcomingTitle, t.home.upcomingEyebrow)}
          </div>
          <Link
            href={APP_ROUTES.poojas}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 text-sm font-medium text-saffron hover:underline sm:h-12 sm:gap-2 sm:text-base"
          >
            {t.home.viewAll}{" "}
            <ArrowRight className="motion-arrow-right h-5 w-5" />
          </Link>
        </motion.div>

        {isLoadingPoojas ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="min-h-[28rem] animate-pulse rounded-lg border border-black/10 bg-white"
              />
            ))}
          </div>
        ) : upcomingPoojas.length > 0 ? (
          <div className="relative">
            <div
              ref={popularPoojaTrackRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-5 md:overflow-visible lg:grid-cols-3"
          >
            {upcomingPoojas.map((pooja) => {
              const poojaTranslation = getLocalizedTranslation(
                pooja.translations,
                selectedDbLanguage,
              );
              const templeTranslation = getLocalizedTranslation(
                pooja.temple?.translations,
                selectedDbLanguage,
              );
              const templeName = templeTranslation?.name;
              const templePlace = templeTranslation?.place;
              return (
                <div
                  key={pooja.slug}
                  className="min-w-0 flex-none basis-[calc((100%-0.75rem)/2)] snap-start md:block md:basis-auto"
                >
                <PoojaCard
                  key={pooja.slug}
                  title={poojaTranslation?.name ?? "Pooja"}
                  location={[templeName, templePlace]
                    .filter(Boolean)
                    .join(", ")}
                  price={formatAmount(pooja.sellingPrice)}
                  originalPrice={formatAmount(pooja.baseAmount)}
                  image={pooja.imageUrls?.[0] ?? "/nava_graha.png"}
                  images={pooja.imageUrls}
                  dayBadge={pooja.poojaDay}
                  stateBadge={pooja.temple?.state}
                  category={pooja.isWeekly ? "Weekly" : "Normal"}
                  href={APP_ROUTES.poojaDetails(pooja.slug)}
                  templeHref={
                    pooja.temple?.slug
                      ? APP_ROUTES.templeDetails(pooja.temple.slug)
                      : undefined
                  }
                  poojaFor={poojaTranslation?.poojaFor}
                />
                </div>
              );
            })}
          </div>
            {upcomingPoojas.length > 2 && (
            <motion.button
              type="button"
              aria-label="Show next popular pooja"
              onClick={scrollPopularPoojas}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-saffron text-white shadow-lg shadow-saffron/25 md:hidden"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          )}
          </div>
        ) : (
          <div className="border-y border-black/10 py-12 text-center">
            <p className="text-base font-medium text-text-primary/60">
              No upcoming poojas found.
            </p>
          </div>
        )}

      </section>

      <section
        id="how-it-works"
        className="mt-12 bg-[#fff8f2] py-12 md:mt-16 md:py-16"
      >
        <div className="container mx-auto grid items-center gap-8 px-4 md:px-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            {renderHeading(t.home.bookingTitle, t.home.bookingEyebrow)}
            <div className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
              {t.home.bookingSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 sm:gap-5"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron text-sm font-semibold leading-none text-white sm:h-11 sm:w-11 sm:text-lg">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-wrap-safe text-lg font-bold leading-6 text-text-primary sm:text-xl sm:leading-7">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-wrap-safe text-sm leading-6 text-text-primary/70 sm:text-base sm:leading-7">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1604085572504-a392ddf0d86a"
              alt={t.home.ceremonyAlt}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <button
              aria-label={t.home.playGuide}
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-saffron shadow-xl transition-transform hover:scale-105"
            >
              <Play className="ml-1 h-7 w-7 fill-saffron" />
            </button>
          </motion.div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 md:px-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          {renderHeading(t.home.guideTitle, t.home.guideEyebrow)}
        </motion.div>
        <div className="mt-8 grid border-y border-black/10 md:grid-cols-2">
          {t.home.guides.map((guide, index) => {
            const Icon = GUIDE_ICONS[index];
            return (
              <article
                key={guide.title}
                className={`py-6 md:p-7 ${index < 3 ? "border-b border-black/10" : ""} ${index === 2 ? "md:border-b-0" : ""} ${index % 2 === 0 ? "md:border-r md:border-black/10" : ""}`}
              >
                {Icon ? (
                  <Icon className="h-9 w-9 text-saffron" />
                ) : (
                  <PublicSvgIcon
                    name={index === 1 ? "pooja" : "temple"}
                    width={36}
                    height={36}
                    className="h-9 w-9 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron"
                  />
                )}
                <h3 className="mt-5 text-wrap-safe text-2xl font-bold leading-8 text-text-primary">
                  {guide.title}
                </h3>
                <p className="mt-2 max-w-md text-wrap-safe text-base leading-7 text-text-primary/70">
                  {guide.description}
                </p>
                <button className="mt-5 inline-flex min-h-11 items-start gap-2 py-2 text-left text-base font-medium leading-5 text-saffron hover:underline">
                  <span className="min-w-0 text-wrap-safe">{guide.action}</span>
                  <ArrowRight className="motion-arrow-right mt-0.5 h-5 w-5 shrink-0" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section
        ref={testimonialSectionRef}
        className="bg-white py-14 md:py-16"
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            {renderHeading(
              t.home.testimonialsTitle,
              t.home.testimonialsEyebrow,
            )}
            <p className="mx-auto mt-3 flex max-w-3xl items-start justify-center gap-2 text-base leading-7 text-text-primary/75 sm:text-lg">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-600" />
              <span className="min-w-0 text-wrap-safe">
                {t.home.testimonialsRating}
              </span>
            </p>
          </motion.div>
          <div
            className="relative"
            onMouseEnter={() => setIsTestimonialPaused(true)}
            onMouseLeave={() => setIsTestimonialPaused(false)}
            onFocusCapture={() => setIsTestimonialPaused(true)}
            onBlurCapture={() => setIsTestimonialPaused(false)}
            onPointerDown={() => setIsTestimonialPaused(true)}
            onPointerUp={() => setIsTestimonialPaused(false)}
            onPointerCancel={() => setIsTestimonialPaused(false)}
          >
          <motion.div
            ref={testimonialTrackRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.name}
                className="h-auto flex-none basis-[82%] snap-start sm:basis-[46%] lg:basis-[calc((100%-4.5rem)/4)]"
              >
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </motion.div>
            <button
              type="button"
              aria-label="Show next testimonial"
              onClick={scrollTestimonials}
              className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-saffron shadow-lg ring-1 ring-black/10 transition hover:bg-saffron hover:text-white lg:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}