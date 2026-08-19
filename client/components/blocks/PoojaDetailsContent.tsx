"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Home,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { OmPattern } from "@/components/ui/om-pattern";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";

import { PoojaBenefitCard } from "@/components/blocks/PoojaBenefitCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PoojaCountdown } from "@/components/blocks/PoojaCountdown";
import { Button } from "@/components/ui/button";
import {
  DB_LANGUAGE_BY_UI_LANGUAGE,
  PACKAGE_INCLUDES,
  WORKFLOW_STEPS,
  type DetailDbLanguage,
} from "@/constants/pooja-details.const";
import { APP_ROUTES } from "@/constants/route.const";
import type {
  Benifit,
  BenifitTranslation,
} from "@/lib/api/benifit/benifits.api";
import type { Pooja, PoojaTranslation } from "@/lib/api/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/temple/temples.api";
import { detailCopy, type DetailCopy } from "@/translations/pooja-detail-copy";
import { getPoojaDateLabel } from "@/lib/pooja-date";

type DbLanguage = DetailDbLanguage;

type PoojaDetailsContentProps = {
  poojaId: string;
  pooja: Pooja;
};

const DEVOTEE_AVATAR_BASE_URL = "/users";
const DEVOTEE_AVATAR_COUNT = 14;
const DEVOTEE_AVATAR_DISPLAY_COUNT = 4;

function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[] | undefined,
  language: DbLanguage,
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
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

function getBenifitTranslation(benifit: Benifit, language: DbLanguage) {
  return getLocalizedTranslation<BenifitTranslation>(
    benifit.translations,
    language,
  );
}

function getFaqs(title: string, benifits: string[], copy: DetailCopy) {
  const firstBenifit = benifits[0] ?? copy.spiritualWellBeing;

  return [
    {
      question: copy.faqBenefitsQuestion(title),
      answer: copy.faqBenefitsAnswer(title, firstBenifit),
    },
    {
      question: copy.faqMantraQuestion,
      answer: copy.faqMantraAnswer,
    },
    {
      question: copy.faqParticipateQuestion,
      answer: copy.faqParticipateAnswer,
    },
    {
      question: copy.faqPrasadQuestion,
      answer: copy.faqPrasadAnswer,
    },
  ];
}

function getStableImageSeed(value: string) {
  return value.split("").reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);
}

function getDevoteeAvatarUrls(seedValue: string) {
  const startIndex = getStableImageSeed(seedValue) % DEVOTEE_AVATAR_COUNT;

  return Array.from({ length: DEVOTEE_AVATAR_DISPLAY_COUNT }, (_, index) => {
    const imageNumber = ((startIndex + index * 3) % DEVOTEE_AVATAR_COUNT) + 1;
    return DEVOTEE_AVATAR_BASE_URL + "/" + imageNumber + ".avif";
  });
}

function getTemplePriest(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const priest = value as { name?: unknown; experience?: unknown };
  const name = typeof priest.name === "string" ? priest.name.trim() : "";
  const experience =
    typeof priest.experience === "string" ? priest.experience.trim() : "";

  return name ? { name, experience } : null;
}
export function PoojaDetailsContent({
  poojaId,
  pooja,
}: PoojaDetailsContentProps) {
  const { language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const selectedDbLanguage = DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const copy = detailCopy[language];

  const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
    pooja.translations,
    selectedDbLanguage,
  );
  const templeTranslation = getLocalizedTranslation<TempleTranslation>(
    pooja.temple?.translations,
    selectedDbLanguage,
  );
  const benifits = pooja.benefits
    .map((benifit) => ({
      slug: benifit.slug,
      image: benifit.imageUrl ?? "",
      translation: getBenifitTranslation(benifit, selectedDbLanguage),
    }))
    .filter((benifit) => Boolean(benifit.translation));
  const title = poojaTranslation?.name ?? copy.defaultPoojaTitle;
  const bookingPhoneNumber = "+918593948881";
  const whatsappMessage = encodeURIComponent(
    `Hi, I want help booking the ${title} pooja on Yaagam.`,
  );
  const whatsappBookingUrl = `https://wa.me/918593948881?text=${whatsappMessage}`;
  const poojaFor =
    poojaTranslation?.poojaFor?.trim() || copy.spiritualWellBeing;
  const benifitNames = benifits
    .map((benifit) => benifit.translation?.name)
    .filter((benifit): benifit is string => Boolean(benifit));
  const normalizedPoojaImages = pooja.imageUrls?.filter(
    (imageUrl): imageUrl is string => Boolean(imageUrl),
  );
  const poojaImages = normalizedPoojaImages?.length
    ? normalizedPoojaImages
    : ["/nava_graha.png"];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = poojaImages[selectedImageIndex] ?? poojaImages[0];
  const hasMultipleImages = poojaImages.length > 1;
  const showPreviousImage = () => {
    setSelectedImageIndex((currentIndex) =>
      currentIndex === 0 ? poojaImages.length - 1 : currentIndex - 1,
    );
  };
  const showNextImage = () => {
    setSelectedImageIndex((currentIndex) =>
      currentIndex === poojaImages.length - 1 ? 0 : currentIndex + 1,
    );
  };
  const details = {
    title,
    about: poojaTranslation?.about ?? copy.defaultPoojaAbout,
    templeName: templeTranslation?.name ?? copy.defaultTemple,
    templePlace: templeTranslation?.place ?? "",
    templeState: pooja.temple?.state ?? "",
    images: poojaImages,
    benifits,
    benifitNames,
    faqs: getFaqs(title, benifitNames, copy),
    weeklyAmount: pooja.sellingPrice,
    normalAmount: pooja.sellingPrice,
  };
  const devoteeAvatarUrls = getDevoteeAvatarUrls(poojaId);
  const templePriest = getTemplePriest(pooja.temple?.templePriest);
  const poojaPlans = [
    ...(pooja.isWeekly
      ? [
          {
            id: "weekly",
            title: copy.weeklyPlan,
            subtitle: details.title,
            amount: details.weeklyAmount,
            originalAmount: pooja.baseAmount,
            hasDiscountedAmount:
              Number(pooja.sellingPrice) < Number(pooja.baseAmount),
            tag: copy.bestValue,
            features: copy.weeklyFeatures,
            image: "/weekly_plan.webp",
            topBgClass: "bg-[#fff3df]",
            badgeBgClass: "bg-[#ea580c]",
            badgeTextClass: "text-white",
          },
        ]
      : []),
    {
      id: "single",
      title: copy.singlePlan,
      subtitle: details.title,
      amount: details.normalAmount,
      originalAmount: pooja.baseAmount,
      hasDiscountedAmount:
        Number(pooja.sellingPrice) < Number(pooja.baseAmount),
      tag: copy.mostChosen,
      features: copy.singleFeatures,
      image: "/one_day.webp",
      topBgClass: "bg-emerald-50",
      badgeBgClass: "bg-emerald-100",
      badgeTextClass: "text-emerald-700",
    },
  ];

  return (
    <main className="bg-white pb-16 text-text-primary">
      <div className="relative isolate overflow-hidden bg-[#fff8e8]">
        <OmPattern />
        <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-14"
      >
        <div>
          <nav className="mb-3 text-xs font-medium text-text-primary/55">
            <Link href={APP_ROUTES.poojas} className="hover:text-saffron">
              {copy.breadCrumps}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">{details.title}</span>
          </nav>

          <div className="relative aspect-16/11 overflow-hidden rounded-lg border-2 border-saffron bg-[#f8fafc]">
            <AnimatePresence>
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={selectedImage}
                  alt={details.title}
                  fill
                  priority
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {hasMultipleImages && (
              <>
                <Button
                  type="button"
                  size="icon"
                  aria-label="Show previous pooja image"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-text-primary shadow-md hover:bg-white"
                >
                  <ChevronLeft className="motion-arrow-left h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  aria-label="Show next pooja image"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-text-primary shadow-md hover:bg-white"
                >
                  <ChevronRight className="motion-arrow-right h-5 w-5" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                  {selectedImageIndex + 1} / {details.images.length}
                </div>
              </>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col justify-center"
        >
          <p className="mb-4 flex min-w-0 items-start gap-2 text-sm font-medium leading-6">
            <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full border border-saffron/35 bg-saffron/15 p-0.5 shadow-[0_2px_5px_rgba(230,126,34,0.28),inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_2px_rgba(154,71,8,0.22)] backdrop-blur-sm before:block before:h-full before:w-full before:rounded-full before:bg-saffron before:shadow-[0_0_8px_rgba(230,126,34,0.95),inset_0_1px_1px_rgba(255,255,255,0.55)]" />
            <span className="min-w-0 flex-1 bg-gradient-to-r from-[#9a4708] via-[#c35f0f] to-[#7a3100] bg-clip-text text-transparent">
              {poojaFor}
            </span>
          </p>

          <h1 className="text-2xl font-extrabold leading-tight text-text-primary md:text-3xl lg:text-4xl">
            {details.title}
          </h1>

          <div className="mt-4 divide-y divide-black/10 border-y border-black/10 text-sm font-medium text-text-primary/70">
              <p className="flex items-start gap-3 py-3">
                <PublicSvgIcon
                  name="temple"
                  width={20}
                  height={20}
                  className="mt-0.5 h-5 w-5 shrink-0 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron"
                />
                {pooja.temple?.slug ? (
                  <Link
                    href={APP_ROUTES.templeDetails(pooja.temple.slug)}
                    title="Click to know more about temple"
                    className="leading-relaxed underline decoration-saffron/40 underline-offset-4 transition-colors hover:text-saffron hover:decoration-saffron"
                  >
                    {[
                      details.templeName,
                      details.templePlace,
                      details.templeState,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Link>
                ) : (
                  <span className="leading-relaxed">
                    {[
                      details.templeName,
                      details.templePlace,
                      details.templeState,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </p>
              <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-2 py-2.5">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-saffron" />
                  <span>{getPoojaDateLabel(pooja.poojaDay)}</span>
                </p>
                {pooja.poojaTime && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-saffron" />
                    <span>{pooja.poojaTime}</span>
                  </p>
                )}
              </div>
          </div>

          <div className="mt-4">
            <PoojaCountdown poojaDay={pooja.poojaDay} />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div
              className="flex shrink-0 -space-x-3"
              onContextMenu={(event) => event.preventDefault()}
            >
              {devoteeAvatarUrls.map((avatarUrl, index) => (
                <Image
                  key={avatarUrl}
                  src={avatarUrl}
                  alt=""
                  width={38}
                  height={38}
                  unoptimized
                  draggable={false}
                  className="h-10 w-10 select-none rounded-full border-2 border-white object-cover shadow-sm"
                  style={{ zIndex: DEVOTEE_AVATAR_DISPLAY_COUNT - index }}
                />
              ))}
            </div>
            <p className="text-sm font-semibold leading-5 text-text-primary/75">
              <span className="font-extrabold text-text-primary">
                10 Lakh+ Devotees
              </span>
              <br />
              have offered Pooja
            </p>
          </div>

          <div className="mt-4 flex w-full flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_112px] sm:items-end">
            <Button
              asChild
              className="inline-flex h-12 min-w-0 w-full rounded-xl px-5 text-sm font-bold shadow-sm"
            >
              <a href="#plans">{copy.selectPlan}</a>
            </Button>
            <div className="flex flex-col items-center justify-center">
              <span className="mb-1 text-center text-xs font-semibold leading-4 text-text-primary/65">
                For booking, call or WhatsApp
              </span>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`tel:${bookingPhoneNumber}`}
                  aria-label="Call for booking"
                  title={`Call ${bookingPhoneNumber}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
                >
                  <PublicSvgIcon name="phone" className="h-10 w-10" />
                </a>
                <a
                  href={whatsappBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp for booking"
                  title="Chat on WhatsApp"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
                >
                  <PublicSvgIcon name="whatsapp" className="h-10 w-10" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
        </motion.section>
      </div>

      <section id="plans" className="mx-auto max-w-7xl px-4 pt-14 md:px-8">
        <h2 className="text-base font-semibold text-text-primary">
          {copy.plansTitle}
        </h2>
        <div className="mt-2 h-0.5 w-28 bg-saffron" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {poojaPlans.map((plan) => (
            <article
              key={plan.title}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm"
            >
              <div className={`grid grid-cols-[1fr_132px] ${plan.topBgClass}`}>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-saffron">
                    {plan.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="min-w-0">
                      {plan.hasDiscountedAmount && (
                        <p className="inline-flex items-center text-xs font-semibold text-text-primary/45 line-through">
                          <IndianRupee className="h-3 w-3" />
                          {formatAmount(plan.originalAmount)}
                        </p>
                      )}
                      <p className="inline-flex items-center text-lg font-extrabold text-saffron">
                        <IndianRupee className="h-4 w-4" />
                        {formatAmount(plan.amount)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${plan.badgeBgClass} ${plan.badgeTextClass}`}
                    >
                      {plan.tag}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center p-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white shadow-sm">
                    <Image
                      src={plan.image}
                      alt={plan.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-4">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-text-primary/70"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </p>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Button
                  asChild
                  className="h-11 w-full rounded-lg font-extrabold"
                >
                  <Link href={APP_ROUTES.poojaBooking(poojaId, plan.id)}>
                    {copy.bookNow}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-5xl px-4 pt-14 text-center md:px-8"
      >
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.aboutPrefix}{" "}
            <span className="text-saffron">{copy.aboutHighlight}</span>
          </h2>

          <p className="mt-2 text-sm font-semibold text-text-primary/60">
            {copy.aboutSubtitle}
          </p>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-sm font-semibold leading-7 text-text-primary/70">
          {details.about}
        </p>
      </motion.section>

      {templePriest && (
        <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 pt-14 md:px-8"
      >
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-extrabold text-text-primary">
              Pooja Performed By
            </h2>
            <div className="mt-2 h-0.5 w-20 bg-saffron" />
          </div>

          <article className="relative mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-[#fffaf3] px-5 py-5 shadow-sm sm:px-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 right-2 select-none text-[10rem] leading-none text-saffron/8"
            >
              {"\u0950"}
            </span>
            <div className="relative z-10">
              <h3 className="text-base font-extrabold text-text-primary">
                {templePriest.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-text-primary/60">
                {[details.templeName, details.templePlace]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <div className="mt-4 space-y-2.5 border-t border-orange-200/70 pt-4 text-sm font-semibold text-text-primary/75">
                <p className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <span className="text-emerald-700">Verified</span> pandit on Yaagam
                  </span>
                </p>
                {templePriest.experience && (
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                    <span>{templePriest.experience} of experience</span>
                  </p>
                )}
                <p className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                  <span>Authorised pandit at {details.templeName}</span>
                </p>
              </div>
            </div>
          </article>
        </motion.section>
      )}
      {details.benifits.length > 0 && (
        <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 pt-14 md:px-8"
      >
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-extrabold text-text-primary">
              {copy.whyPrefix}{" "}
              <span className="text-saffron">{copy.whyHighlight}</span>
              {copy.whySuffix}
            </h2>
            <div className="mt-2 h-0.5 w-28 bg-saffron" />
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {details.benifits.map((benifit) => (
              <PoojaBenefitCard
                key={benifit.slug}
                image={benifit.image}
                title={benifit.translation?.name ?? ""}
                description={benifit.translation?.description ?? ""}
                fallbackAlt={copy.benefitAlt}
              />
            ))}
          </div>
          <div className="mt-8 h-px w-full bg-black/5" />
        </motion.section>
      )}

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto mt-16 max-w-7xl border-t border-black/10 px-4 pt-14 md:px-8"
      >
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.packagePrefix}{" "}
            <span className="text-saffron">{copy.packageHighlight}</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-text-primary/60">
            {copy.packageSubtitle}
          </p>
        </div>
        <div className="mt-10 grid gap-7 md:grid-cols-2">
          {copy.packageIncludes.map((item, index) => {
            const Icon = PACKAGE_INCLUDES[index]?.icon ?? Home;
            return (
              <article key={item.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron/10 text-saffron">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-text-primary/60">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-lg bg-emerald-50 px-6 py-5 text-sm font-medium text-text-primary/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-700" />
            <span className="text-text-primary">{copy.promiseTitle}</span>
          </div>
          <p>{copy.promiseText}</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {copy.promiseBadges.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-3 py-1 text-emerald-800"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-16 bg-[#fff8f2] py-14"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.workflowPrefix}{" "}
            <span className="text-saffron">{copy.workflowHighlight}</span>{" "}
            {copy.workflowSuffix}
          </h2>
          <p className="mt-1 text-sm font-semibold text-text-primary/60">
            {copy.workflowSubtitle}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.workflowSteps.map((step, index) => {
              if (index === 3) return null;

              const style = WORKFLOW_STEPS[index] ?? WORKFLOW_STEPS[0];
              const Icon = style.icon;
              return (
                <article
                  key={step.title}
                  className={`rounded-lg border p-5 ${style.tone}
                                                              transition-all duration-300 ease-in-out
                                                              shadow-lg
                                                              hover:-translate-y-2
                                                              hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]`}
                >
                  <Icon className="h-5 w-5" />
                  <h3 className="mt-4 text-xs font-semibold uppercase">
                    {step.title}
                  </h3>
                  <p className="mt-3 min-h-12 text-xs font-semibold leading-5 text-text-primary/70">
                    {step.description}
                  </p>
                  {index < copy.workflowSteps.length - 1 && (
                    <ArrowRight className="motion-arrow-right mt-3 hidden h-5 w-5 text-saffron lg:block" />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </motion.section>
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 py-14 md:px-8"
      >
        <h2 className="text-xl font-extrabold text-text-primary">
          {copy.faqTitle}
        </h2>
        <div className="mt-5 divide-y divide-black/10">
          {details.faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-text-primary">
                {faq.question}
                <CircleDot className="h-4 w-4 shrink-0 text-text-primary/45 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-primary/65">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

      </motion.section>
      <BackToTopButton targetId="plans" />
    </main>
  );
}
