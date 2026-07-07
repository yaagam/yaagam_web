"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import {
  CalendarDays,
  IndianRupee,
  Landmark,
  MoveRight,
} from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { getPoojaDateLabel } from "@/lib/pooja-date";

export interface PoojaCardProps {
  title: string;
  location?: string;
  price: string;
  image: string;
  dayBadge: string;
  stateBadge?: string;
  category?: string;
  benifits?: string[];
  href?: string;
  templeHref?: string;
}

export function PoojaCard({
  title,
  location,
  price,
  image,
  dayBadge,
  stateBadge,
  category = "Normal",
  benifits = [],
  href,
  templeHref,
}: PoojaCardProps) {
  const { t } = useLanguage();
  const normalizedPrice = price
    .replace("?", "")
    .replace("₹", "")
    .replace("â‚¹", "")
    .trim();
  const benifitsText =
    benifits.length > 0
      ? `Pooja is for benifits like ${benifits.join(", ")}.`
      : "Pooja is for benifits, devotion, and spiritual wellbeing.";

  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-16/10 overflow-hidden bg-[#f8fafc]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          unoptimized={image.startsWith("http")}
        />
      </div>
      <div className="flex flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-7 items-center rounded-full bg-saffron/10 px-3 py-1 text-xs font-extrabold text-saffron">
            {category}
          </span>
          <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-black/4 px-3 py-1 text-xs font-extrabold text-text-primary/65">
            <CalendarDays className="h-3.5 w-3.5" />
            {getPoojaDateLabel(dayBadge)}
          </span>
          {stateBadge && (
            <span className="inline-flex min-h-7 items-center rounded-full bg-black/4 px-3 py-1 text-xs font-extrabold text-text-primary/65">
              {stateBadge}
            </span>
          )}
        </div>

        <h2 className="mt-4 line-clamp-2 text-xl font-extrabold leading-7 text-text-primary">
          {title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-text-primary/60">
          {benifitsText}
        </p>

        {location && (
          <p className="mt-4 flex items-start gap-2 text-sm font-bold leading-6 text-text-primary/70">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
            {templeHref ? (
              <Link
                href={templeHref}
                title="Click to know more about temple"
                className="line-clamp-2 min-w-0 underline decoration-saffron/40 underline-offset-4 transition-colors hover:text-saffron hover:decoration-saffron"
              >
                {location}
              </Link>
            ) : (
              <span className="line-clamp-2 min-w-0">{location}</span>
            )}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="inline-flex items-center text-xl font-extrabold text-saffron">
            <IndianRupee className="h-5 w-5" />
            {normalizedPrice}
          </p>
          {href ? (
            <Button asChild className="min-h-11 rounded-full px-5">
              <Link href={href}>
                {t.card.bookNow}
                <MoveRight className="motion-arrow-right ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="min-h-11 rounded-full px-5">
              {t.card.bookNow}
              <MoveRight className="motion-arrow-right ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
