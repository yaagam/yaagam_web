"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Landmark, MapPin } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE } from "@/constants/poojas-browser.const";
import { APP_ROUTES } from "@/constants/route.const";
import type {
  Temple,
  TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";

type TemplesListContentProps = {
  temples: Temple[];
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

export function TemplesListContent({ temples }: TemplesListContentProps) {
  const { language } = useLanguage();
  const selectedDbLanguage = POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
              <Landmark className="h-4 w-4" />
              Temples
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
              Temples of Bharat
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-text-primary/65">
              Most visited pilgrimage sites and their significance.
            </p>
          </div>
        </div>

        {temples.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {temples.map((temple) => {
              const translation = getLocalizedTempleTranslation(
                temple,
                selectedDbLanguage,
              );
              const name = translation?.name ?? "Temple";
              const place = [translation?.place, translation?.district, temple.state]
                .filter(Boolean)
                .join(", ");
              const imageUrl = getApiImageUrl(temple.imageUrl) || "/banner.png";

              return (
                <article
                  key={temple.id}
                  className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Link
                    href={APP_ROUTES.templeDetails(temple.id)}
                    className="block"
                    aria-label={`View ${name}`}
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-[#f8fafc]">
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        unoptimized={imageUrl.startsWith("http")}
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="p-5">
                    <span className="inline-flex min-h-7 items-center rounded-full border border-black/10 bg-[#fff8f2] px-3 py-1 text-xs font-extrabold text-text-primary/65">
                      Temples of Bharat
                    </span>
                    <h2 className="mt-4 line-clamp-2 text-xl font-extrabold leading-7 text-text-primary">
                      {name}
                    </h2>
                    {place && (
                      <p className="mt-2 flex items-start gap-2 text-sm font-bold leading-6 text-text-primary/60">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                        <span className="line-clamp-2">{place}</span>
                      </p>
                    )}
                    {translation?.description && (
                      <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-text-primary/60">
                        {translation.description}
                      </p>
                    )}
                    <Button asChild className="mt-5 min-h-11 rounded-full px-5">
                      <Link href={APP_ROUTES.templeDetails(temple.id)}>
                        View temple
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <Landmark className="h-9 w-9 text-text-primary/35" />
            <p className="mt-3 text-lg font-extrabold text-text-primary">
              No temples available
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
              Temples will appear here once they are added.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}