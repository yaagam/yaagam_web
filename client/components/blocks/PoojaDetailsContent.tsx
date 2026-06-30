"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleDot,
  Clock,
  Home,
  IndianRupee,
  MapPin,
  ShieldCheck,
} from "lucide-react";

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
} from "@/lib/api/admin/benifit/benifits.api";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { detailCopy, type DetailCopy } from "@/lib/i18n/pooja-detail-copy";

type DbLanguage = DetailDbLanguage;

type PoojaDetailsContentProps = {
  poojaId: string;
  pooja: Pooja;
};

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

function getDiscountedAmount(
  baseAmount: string | number,
  discount: number | null | undefined,
) {
  const amount = Number(baseAmount);

  if (Number.isNaN(amount)) return baseAmount;
  if (!discount) return amount;

  return Math.max(0, Math.round(amount - (amount * discount) / 100));
}

function getBenifitTranslation(benifit: Benifit, language: DbLanguage) {
  return getLocalizedTranslation<BenifitTranslation>(
    benifit.translations,
    language,
  );
}

function getApiImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return "";
  if (/^(?:https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith("/")) return imageUrl;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return imageUrl;

  try {
    return new URL(imageUrl, apiBaseUrl).toString();
  } catch {
    return imageUrl;
  }
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

export function PoojaDetailsContent({
  poojaId,
  pooja,
}: PoojaDetailsContentProps) {
  const { language } = useLanguage();
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
      id: benifit.id,
      image: getApiImageUrl(benifit.imageUrl),
      translation: getBenifitTranslation(benifit, selectedDbLanguage),
    }))
    .filter((benifit) => Boolean(benifit.translation));
  const title = poojaTranslation?.name ?? copy.defaultPoojaTitle;
  const benifitNames = benifits
    .map((benifit) => benifit.translation?.name)
    .filter((benifit): benifit is string => Boolean(benifit));
  const details = {
    title,
    about: poojaTranslation?.about ?? copy.defaultPoojaAbout,
    templeName: templeTranslation?.name ?? copy.defaultTemple,
    templePlace: templeTranslation?.place ?? "",
    templeState: pooja.temple?.state ?? "",
    images: pooja.imageUrls?.length ? pooja.imageUrls : ["/nava_graha.png"],
    benifits,
    benifitNames,
    faqs: getFaqs(title, benifitNames, copy),
    weeklyAmount: getDiscountedAmount(pooja.baseAmount, pooja.weeklyDiscount),
    normalAmount: getDiscountedAmount(pooja.baseAmount, pooja.normalDiscount),
  };

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-14">
        <div>
          <nav className="mb-3 text-xs font-bold text-text-primary/55">
            <Link href={APP_ROUTES.poojas} className="hover:text-saffron">
              Pooja
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">{details.title}</span>
          </nav>

          <div className="relative aspect-16/11 overflow-hidden rounded-lg border-2 border-saffron bg-[#f8fafc]">
            <Image
              src={details.images[0]}
              alt={details.title}
              fill
              priority
              unoptimized={details.images[0].startsWith("http")}
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-extrabold leading-8 text-text-primary md:text-3xl">
            {details.title}
          </h1>
          {details.benifitNames.length > 0 && (
            <p className="mt-3 text-sm font-bold leading-6 text-saffron">
              {details.benifitNames.join(", ")}
            </p>
          )}
          <div className="mt-6 space-y-3 text-sm font-semibold text-text-primary/65">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-primary/45" />
              <span>
                {[details.templeName, details.templePlace, details.templeState]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-text-primary/45" />
              <span>{pooja.poojaDay}</span>
            </p>
            {pooja.poojaTime && (
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-text-primary/45" />
                <span>{pooja.poojaTime}</span>
              </p>
            )}
          </div>
          <PoojaCountdown poojaDay={pooja.poojaDay} />
          <Button asChild className="mt-6 h-12 rounded-lg px-8 font-extrabold">
            <a href="#plans">{copy.selectPlan}</a>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-14 text-center md:px-8">
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-text-primary">
            {copy.aboutPrefix}{" "}
            <span className="text-saffron">{copy.aboutHighlight}</span>
          </h2>

          <div className="mt-2 h-0.5 w-28 rounded-full bg-saffron" />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-sm font-semibold leading-7 text-text-primary/70">
          {details.about}
        </p>
      </section>

      {details.benifits.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 text-center pt-14 md:px-8">
          <h2 className="text-xl font-extrabold text-text-primary">
            {copy.whyPrefix}{" "}
            <span className="text-saffron">{copy.whyHighlight}</span>
            {copy.whySuffix}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-12">
            {details.benifits.map((benifit) => (
              <PoojaBenefitCard
                key={benifit.id}
                image={benifit.image}
                title={benifit.translation?.name ?? ""}
                description={benifit.translation?.description ?? ""}
                fallbackAlt={copy.benefitAlt}
              />
            ))}
          </div>
        </section>
      )}

      <section
        id="plans"
        className="mx-auto mt-16 max-w-7xl px-4 md:px-8 border-t border-black/10 pt-14"
      >
        <h2 className="text-base font-extrabold text-text-primary">
          {copy.plansTitle}
        </h2>
        <div className="mt-2 h-0.5 w-28 bg-saffron" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              id: "weekly",
              title: copy.weeklyPlan,
              subtitle: details.title,
              amount: details.weeklyAmount,
              tag: copy.bestValue,
              features: copy.weeklyFeatures,
            },
            {
              id: "single",
              title: copy.singlePlan,
              subtitle: details.title,
              amount: details.normalAmount,
              tag: copy.mostChosen,
              features: copy.singleFeatures,
            },
          ].map((plan) => (
            <article
              key={plan.title}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm"
            >
              <div className="grid grid-cols-[1fr_132px] bg-[#fff3df]">
                <div className="p-4">
                  <h3 className="text-sm font-extrabold text-saffron">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-text-primary/70">
                    {plan.subtitle}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <p className="inline-flex items-center text-lg font-extrabold text-saffron">
                      <IndianRupee className="h-4 w-4" />
                      {formatAmount(plan.amount)}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-extrabold text-emerald-700">
                      {plan.tag}
                    </span>
                  </div>
                </div>
                <div className="relative min-h-28 bg-saffron/10">
                  <Image
                    src={details.images[0]}
                    alt={plan.title}
                    fill
                    unoptimized={details.images[0].startsWith("http")}
                    className="object-cover"
                  />
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

      <section className="mx-auto mt-16 max-w-7xl border-t border-black/10 px-4 pt-14 md:px-8">
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
                  <h3 className="text-sm font-extrabold text-text-primary">
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

        <div className="mt-12 flex flex-col gap-4 rounded-lg bg-emerald-50 px-6 py-5 text-sm font-bold text-text-primary/70 md:flex-row md:items-center md:justify-between">
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
      </section>

      <section className="mt-16 bg-[#fff8f2] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.workflowPrefix}{" "}
            <span className="text-saffron">{copy.workflowHighlight}</span>{" "}
            {copy.workflowSuffix}
          </h2>
          <p className="mt-1 text-sm font-semibold text-text-primary/60">
            {copy.workflowSubtitle}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {copy.workflowSteps.map((step, index) => {
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
                  <h3 className="mt-4 text-xs font-extrabold uppercase">
                    {step.title}
                  </h3>
                  <p className="mt-3 min-h-12 text-xs font-semibold leading-5 text-text-primary/70">
                    {step.description}
                  </p>
                  {index < copy.workflowSteps.length - 1 && (
                    <ArrowRight className="mt-3 hidden h-5 w-5 text-saffron lg:block" />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <h2 className="text-xl font-extrabold text-text-primary">
          {copy.faqTitle}
        </h2>
        <div className="mt-5 divide-y divide-black/10">
          {details.faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-text-primary">
                {faq.question}
                <CircleDot className="h-4 w-4 shrink-0 text-text-primary/45 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-primary/65">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
