"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { CalendarDays, IndianRupee, MoveRight } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import { getPoojaDateLabel } from "@/lib/pooja-date";

export interface PoojaCardProps {
  title: string;
  location?: string;
  price: string;
  originalPrice?: string;
  image: string;
  images?: string[];
  dayBadge: string;
  stateBadge?: string;
  category?: string;
  poojaFor?: string;
  href?: string;
  templeHref?: string;
}

export function PoojaCard({
  title,
  location,
  price,
  originalPrice,
  image,
  images,
  dayBadge,
  poojaFor,
  href,
  templeHref,
}: PoojaCardProps) {
  const { t } = useLanguage();
  const normalizedPrice = price.replace(/[^\d.,-]/g, "").trim();
  const normalizedOriginalPrice = originalPrice
    ?.replace(/[^\d.,-]/g, "")
    .trim();
  const hasDiscountedPrice =
    Boolean(normalizedOriginalPrice) &&
    normalizedOriginalPrice !== normalizedPrice;
  const poojaForText = poojaFor || t.card.spiritualWellbeing;

  const displayImages = images?.length ? images : [image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayImages.length]);

  const activeImage = displayImages[currentImageIndex];

  return (
    <motion.article
      whileHover={{ y: -6, transition: { duration: 0.4, ease: "easeOut" } }}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-black/5 bg-white/95 backdrop-blur-md shadow-md transition-shadow hover:shadow-2xl hover:shadow-saffron/15"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-[#f8fafc]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-black/4 px-2 py-1 text-[10px] sm:min-h-7 sm:px-3 sm:text-xs font-semibold text-text-primary/65">
            <CalendarDays className="h-3.5 w-3.5" />
            {getPoojaDateLabel(dayBadge)}
          </span>
        </div>

        <h2 className="mt-3 min-h-5 line-clamp-2 sm:min-h-7 text-sm font-extrabold leading-5 sm:mt-4 sm:text-xl sm:leading-7 text-text-primary">
          {title}
        </h2>
        <p className="mt-1 flex min-h-8 min-w-0 items-start gap-1.5 text-[11px] font-medium leading-4 sm:gap-2 sm:text-sm sm:leading-6">
          <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full border border-saffron/35 bg-saffron/15 p-0.5 shadow-[0_2px_5px_rgba(230,126,34,0.28),inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_2px_rgba(154,71,8,0.22)] backdrop-blur-sm before:block before:h-full before:w-full before:rounded-full before:bg-saffron before:shadow-[0_0_8px_rgba(230,126,34,0.95),inset_0_1px_1px_rgba(255,255,255,0.55)]" />
          <span className="line-clamp-2 min-w-0 flex-1 bg-gradient-to-r from-[#9a4708] via-[#c35f0f] to-[#7a3100] bg-clip-text text-transparent">
            {poojaForText}
          </span>
        </p>
        {location && (
          <p className="mt-3 flex min-h-4 min-w-0 items-start gap-1.5 text-[11px] font-medium leading-4 sm:mt-4 sm:gap-2 sm:text-sm sm:leading-6 text-text-primary/70">
            <PublicSvgIcon
              name="temple"
              width={16}
              height={16}
              className="mt-0.5 h-4 w-4 shrink-0 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron"
            />
            {templeHref ? (
              <Link
                href={templeHref}
                title="Click to know more about temple"
                className="truncate flex-1 min-w-0 underline decoration-saffron/40 underline-offset-4 transition-colors hover:text-saffron hover:decoration-saffron"
              >
                {location}
              </Link>
            ) : (
              <span className="truncate flex-1 min-w-0">{location}</span>
            )}
          </p>
        )}

        <div className="mt-auto flex flex-col items-stretch gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            {hasDiscountedPrice && (
              <p className="inline-flex items-center text-[11px] font-semibold sm:text-sm text-text-primary/40 line-through">
                <IndianRupee className="h-3.5 w-3.5" />
                {normalizedOriginalPrice}
              </p>
            )}
            <p className="inline-flex items-center text-base font-extrabold sm:text-xl text-saffron">
              <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
              {normalizedPrice}
            </p>
          </div>
          {href ? (
            <Button
              asChild
              className="min-h-9 w-full rounded-full px-2 text-[10px] sm:min-h-11 sm:w-auto sm:px-5 sm:text-sm"
            >
              <Link href={href}>
                {t.card.bookNow}
                <MoveRight className="motion-arrow-right ml-1 hidden h-4 w-4 sm:block" />
              </Link>
            </Button>
          ) : (
            <Button className="min-h-9 w-full rounded-full px-2 text-[10px] sm:min-h-11 sm:w-auto sm:px-5 sm:text-sm">
              {t.card.bookNow}
              <MoveRight className="motion-arrow-right ml-1 hidden h-4 w-4 sm:block" />
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
