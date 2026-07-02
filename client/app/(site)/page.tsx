"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeroSection } from "@/components/blocks/HeroSection";
import { PoojaCard } from "@/components/blocks/PoojaCard";
import { TestimonialCard } from "@/components/blocks/TestimonialCard";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  Play,
  Star,
  Users,
} from "lucide-react";
import {
  DAY_INDEX_BY_NAME,
  GUIDE_ICONS,
  HOME_DB_LANGUAGE_BY_UI_LANGUAGE,
  TESTIMONIALS,
  UPCOMING_POOJAS_LIMIT,
  type HomeDbLanguage,
} from "@/constants/home-page.const";
import { APP_ROUTES } from "@/constants/route.const";
import type { Benifit } from "@/lib/api/admin/benifit/benifits.api";
import type { Pooja } from "@/lib/api/admin/pooja/poojas.api";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { useLanguage } from "@/components/providers/LanguageProvider";

type DbLanguage = HomeDbLanguage;
const DEVOTEE_AVATAR_URLS = Array.from(
  { length: 10 },
  (_, index) =>
    `https://pub-b562a1837efa4ecd9355514d86041756.r2.dev/users/yaagam_devotee_avatar_${String(index + 1).padStart(2, "0")}.webp`,
);
const DEVOTEE_AVATAR_TRAIN_URLS = [
  ...DEVOTEE_AVATAR_URLS,
  ...DEVOTEE_AVATAR_URLS,
];

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


export default function Home() {
  const { language, t } = useLanguage();
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [isLoadingPoojas, setIsLoadingPoojas] = useState(true);
  const selectedDbLanguage = HOME_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const upcomingPoojas = useMemo(() => getUpcomingPoojas(poojas), [poojas]);
  useEffect(() => {
    let isActive = true;
    async function loadUpcomingPoojas() {
      setIsLoadingPoojas(true);
      try {
        const response = await getPoojasApi({ page: 1, limit: 100 });
        if (isActive) setPoojas(response.items);
      } catch {
        if (isActive) setPoojas([]);
      } finally {
        if (isActive) setIsLoadingPoojas(false);
      }
    }
    void loadUpcomingPoojas();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="flex w-full flex-col pb-16">
      <HeroSection />

      <section aria-label={t.home.trustLabel} className="border-b border-saffron/20 bg-white">
        <div className="overflow-hidden border-b border-saffron/10 py-4" aria-hidden="true">
          <div className="yaagam-avatar-train flex w-max">
            {[0, 1].map((trainCar) => (
              <div key={trainCar} className="flex shrink-0 gap-4 px-2">
                {DEVOTEE_AVATAR_TRAIN_URLS.map((avatarUrl, index) => (
                  <Image
                    key={`${trainCar}-${avatarUrl}-${index}`}
                    src={avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    sizes="56px"
                    className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-saffron/25"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="container mx-auto grid gap-6 px-4 py-7 sm:grid-cols-3 md:px-8">
          <div className="flex items-start gap-3">
            <Users className="h-7 w-7 shrink-0 text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.devotees}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.devoteesSub}</span></div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-7 w-7 shrink-0 fill-saffron text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.rating}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.ratingSub}</span></div>
          </div>
          <div className="flex items-start gap-3">
            <PackageCheck className="h-7 w-7 shrink-0 text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.prasad}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.prasadSub}</span></div>
          </div>
        </div>
      </section>

      <section id="upcoming-poojas" className="container mx-auto mt-20 px-4 md:mt-28 md:px-8">
        <div className="mb-9 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.upcomingEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.upcomingTitle}</h2>
            <p className="mt-3 max-w-2xl text-wrap-safe text-base leading-7 text-text-primary/70 sm:text-lg">{t.home.upcomingDescription}</p>
          </div>
          <Link
            href={APP_ROUTES.poojas}
            className="hidden h-12 shrink-0 items-center gap-2 text-base font-bold text-saffron hover:underline sm:flex"
          >
            {t.home.viewAll} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {isLoadingPoojas ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="min-h-[28rem] animate-pulse rounded-lg border border-black/10 bg-white"
              />
            ))}
          </div>
        ) : upcomingPoojas.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
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
                <PoojaCard
                  key={pooja.id}
                  title={poojaTranslation?.name ?? "Pooja"}
                  location={[templeName, templePlace].filter(Boolean).join(", ")}
                  price={formatAmount(pooja.baseAmount)}
                  image={pooja.imageUrls?.[0] ?? "/nava_graha.png"}
                  dayBadge={pooja.poojaDay}
                  stateBadge={pooja.temple?.state}
                  category={pooja.isWeekly ? "Weekly" : "Normal"}
                  href={APP_ROUTES.poojaDetails(pooja.id)}
                  benifits={pooja.benefits
                    ?.slice(0, 3)
                    .map((benifit) =>
                      getBenifitLabel(benifit, selectedDbLanguage),
                    )
                    .filter((benifit): benifit is string => Boolean(benifit))}
                />
              );
            })}
          </div>
        ) : (
          <div className="border-y border-black/10 py-12 text-center">
            <p className="text-base font-bold text-text-primary/60">
              No upcoming poojas found.
            </p>
          </div>
        )}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href={APP_ROUTES.poojas}
            className="inline-flex h-12 items-center gap-2 text-base font-bold text-saffron hover:underline"
          >
            {t.home.viewAll} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="mt-24 bg-[#fff8f2] py-20 md:mt-32">
        <div className="container mx-auto grid items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.bookingEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.bookingTitle}</h2>
            <div className="mt-10 space-y-8">
              {t.home.bookingSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4 sm:gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron text-lg font-extrabold text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <h3 className="text-wrap-safe text-xl font-bold leading-7 text-text-primary">{step.title}</h3>
                    <p className="mt-1 text-wrap-safe text-base leading-7 text-text-primary/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-xl">
            <Image src="https://images.unsplash.com/photo-1604085572504-a392ddf0d86a" alt={t.home.ceremonyAlt} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/25" />
            <button aria-label={t.home.playGuide} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-saffron shadow-xl transition-transform hover:scale-105">
              <Play className="ml-1 h-7 w-7 fill-saffron" />
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.guideEyebrow}</p>
          <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.guideTitle}</h2>
          <p className="mt-3 text-wrap-safe text-base leading-7 text-text-primary/70 sm:text-lg">{t.home.guideDescription}</p>
        </div>
        <div className="mt-12 grid border-y border-black/10 md:grid-cols-2">
          {t.home.guides.map((guide, index) => {
            const Icon = GUIDE_ICONS[index];
            return (
              <article key={guide.title} className={`py-8 md:p-9 ${index < 3 ? "border-b border-black/10" : ""} ${index === 2 ? "md:border-b-0" : ""} ${index % 2 === 0 ? "md:border-r md:border-black/10" : ""}`}>
                <Icon className="h-9 w-9 text-saffron" />
                <h3 className="mt-5 text-wrap-safe text-2xl font-bold leading-8 text-text-primary">{guide.title}</h3>
                <p className="mt-2 max-w-md text-wrap-safe text-base leading-7 text-text-primary/70">{guide.description}</p>
                <button className="mt-5 inline-flex min-h-11 items-start gap-2 py-2 text-left text-base font-bold leading-5 text-saffron hover:underline"><span className="min-w-0 text-wrap-safe">{guide.action}</span><ArrowRight className="mt-0.5 h-5 w-5 shrink-0" /></button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.testimonialsEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.testimonialsTitle}</h2>
            <p className="mx-auto mt-3 flex max-w-3xl items-start justify-center gap-2 text-base leading-7 text-text-primary/75 sm:text-lg"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-saffron" /><span className="min-w-0 text-wrap-safe">{t.home.testimonialsRating}</span></p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((testimonial) => <TestimonialCard key={testimonial.name} {...testimonial} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
