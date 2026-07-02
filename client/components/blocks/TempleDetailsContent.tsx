"use client";

import Image from "next/image";
import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";

import { PoojaCard } from "@/components/blocks/PoojaCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { APP_ROUTES } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type {
  Temple,
  TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";
import { POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE } from "@/constants/poojas-browser.const";

type DbLanguage = TempleTranslation["language"];

type TempleDetailsContentProps = {
  temple: Temple;
  poojas: Pooja[];
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

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TempleDetailsContent({
  temple,
  poojas,
}: TempleDetailsContentProps) {
  const { language } = useLanguage();
  const selectedDbLanguage = POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const translation = getLocalizedTranslation<TempleTranslation>(
    temple.translations,
    selectedDbLanguage,
  );
  const imageUrl = getApiImageUrl(temple.imageUrl) || "/banner.png";
  const title = translation?.name ?? "Temple";
  const place = [translation?.place, translation?.district, temple.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:py-14">
        <div>
          <nav className="mb-3 text-xs font-bold text-text-primary/55">
            <Link href={APP_ROUTES.temples} className="hover:text-saffron">
              Temples
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">{title}</span>
          </nav>
          <div className="relative aspect-16/10 overflow-hidden rounded-lg border-2 border-saffron bg-[#f8fafc]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              unoptimized={imageUrl.startsWith("http")}
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            <Landmark className="h-4 w-4" />
            Temple
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {title}
          </h1>
          {place && (
            <p className="mt-5 flex items-start gap-2 text-sm font-bold leading-6 text-text-primary/65">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
              <span>{place}</span>
            </p>
          )}
          {translation?.description && (
            <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-text-primary/70">
              {translation.description}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-black/10 px-4 pt-12 md:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary">
              Poojas at {title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-text-primary/60">
              Browse available rituals from this temple.
            </p>
          </div>
        </div>

        {poojas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {poojas.map((pooja) => {
              const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
                pooja.translations,
                selectedDbLanguage,
              );
              const poojaImage = pooja.imageUrls?.[0] ?? "/chandra_graha.png";

              return (
                <PoojaCard
                  key={pooja.id}
                  title={poojaTranslation?.name ?? "Untitled pooja"}
                  price={formatAmount(pooja.baseAmount)}
                  image={poojaImage}
                  dayBadge={pooja.poojaDay}
                  category={pooja.isWeekly ? "Weekly" : "Normal"}
                  href={APP_ROUTES.poojaDetails(pooja.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <Landmark className="h-9 w-9 text-text-primary/35" />
            <p className="mt-3 text-lg font-extrabold text-text-primary">
              No poojas found
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
              Poojas for this temple will appear here once they are available.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}