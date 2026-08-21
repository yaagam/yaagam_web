"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import { ChevronRight, MapPin } from "lucide-react";

import { PoojaCard } from "@/components/blocks/PoojaCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { APP_ROUTES } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/pooja/poojas.api";
import type {
  TempleDetails,
  TempleTranslation,
} from "@/lib/api/temple/temples.api";
import { POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE } from "@/constants/poojas-browser.const";
import { getLocalizedPoojaImages } from "@/lib/pooja-images";

type DbLanguage = TempleTranslation["language"];

type TempleDetailsContentProps = {
  temple: TempleDetails;
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

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function TempleIntro({
  imageUrl,
  place,
  title,
  translation,
}: {
  imageUrl: string;
  place: string;
  title: string;
  translation: TempleTranslation | null;
}) {
  return (
    <article className="w-full pb-8 text-left">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">
          {title}
        </h1>

        {place && (
          <p className="mt-4 flex items-start gap-2 text-sm font-semibold leading-6 text-text-primary/65">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
            <span>{place}</span>
          </p>
        )}
      </header>

      <figure className="my-8 max-w-[1200px]">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5">
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>
      </figure>

      {translation?.description && (
        <div className="mt-8 max-w-4xl text-lg font-medium leading-9 text-text-primary/75 md:text-xl md:leading-10">
          {translation.description.split("\n").map((paragraph, index) =>
            paragraph.trim() ? (
              <p key={index} className="mb-6">
                {paragraph}
              </p>
            ) : null,
          )}
        </div>
      )}
    </article>
  );
}

function TemplePoojasSection({
  poojas,
  selectedDbLanguage,
  title,
}: {
  poojas: Pooja[];
  selectedDbLanguage: DbLanguage;
  title: string;
}) {
  const poojaTrackRef = useRef<HTMLDivElement>(null);

  const scrollPoojas = useCallback(() => {
    const track = poojaTrackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 12;
    const step = firstCard.offsetWidth + gap;
    const atEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

    track.scrollTo({
      left: atEnd ? 0 : track.scrollLeft + step,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="w-full border-t border-black/10 px-4 pt-10 md:px-8">
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
        <div className="relative max-w-[780px]">
          <div
            ref={poojaTrackRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3 [&_article>div:first-child]:aspect-[4/3] [&_article>div:last-child]:p-3 [&_article_h2]:mt-3 [&_article_h2]:text-base [&_article_h2]:leading-6 [&_article_p]:text-xs [&_article_p]:leading-5 [&_article_button]:min-h-9 [&_article_button]:px-3 [&_article_button]:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
          {poojas.map((pooja) => {
            const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
              pooja.translations,
              selectedDbLanguage,
            );
            const poojaImages = getLocalizedPoojaImages(
              pooja,
              selectedDbLanguage,
            );
            const poojaImage = poojaImages[0] ?? "/chandra_graha.png";

            return (
              <div
                key={pooja.slug + "-" + selectedDbLanguage}
                className="min-w-0 flex-none basis-[70%] snap-start sm:block sm:basis-auto"
              >
                <PoojaCard
                  title={poojaTranslation?.name ?? "Untitled pooja"}
                  price={formatAmount(pooja.sellingPrice)}
                  originalPrice={formatAmount(pooja.baseAmount)}
                  image={poojaImage}
                  images={poojaImages}
                  dayBadge={pooja.poojaDay}
                  category={pooja.isWeekly ? "Weekly" : "Normal"}
                  poojaFor={poojaTranslation?.poojaFor}
                  href={APP_ROUTES.poojaDetails(pooja.slug)}
                />
              </div>
            );
          })}
          </div>
          {poojas.length > 2 && (
            <motion.button
              type="button"
              onClick={scrollPoojas}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              aria-label="Show more poojas"
              className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-saffron/25 bg-white/95 text-saffron shadow-md sm:hidden"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
          <PublicSvgIcon
            name="temple"
            width={36}
            height={36}
            className="h-9 w-9 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron"
          />
          <p className="mt-3 text-lg font-extrabold text-text-primary">
            No poojas found
          </p>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
            Poojas for this temple will appear here once they are available.
          </p>
        </div>
      )}
    </section>
  );
}

export function TempleDetailsContent({
  temple,
  poojas,
}: TempleDetailsContentProps) {
  const { language } = useLanguage();
  const selectedDbLanguage =
    POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const translation = getLocalizedTranslation<TempleTranslation>(
    temple.translations,
    selectedDbLanguage,
  );
  const imageUrl = temple.heroImageUrl || "/banner.png";
  const title = translation?.name ?? "Temple";
  const place = [translation?.place, translation?.district, temple.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="w-full px-4 py-10 md:px-8 md:py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-text-primary/55">
          <Link href={APP_ROUTES.temples} className="hover:text-saffron">
            Temples
          </Link>
          <span>/</span>
          <span className="text-text-primary">{title}</span>
        </nav>

        <TempleIntro
          imageUrl={imageUrl}
          place={place}
          title={title}
          translation={translation}
        />
      </section>
      <TemplePoojasSection
        poojas={poojas}
        selectedDbLanguage={selectedDbLanguage}
        title={title}
      />
    </main>
  );
}

