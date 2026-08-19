import type { Metadata } from "next";

import { getEnglishOnlyAlternates, getPublicUrl } from "@/translations/metadata";
import { defaultLanguage, isLanguage, type Language } from "@/translations/locales";

const pathname = "/about-us";
const title = "About YAAGAM | Devotion Without Distance";
const description = "YAAGAM brings sacred temple poojas, rituals, and devotional offerings closer to devotees, wherever they are.";

export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : defaultLanguage;
  const canonicalUrl = getPublicUrl(pathname, defaultLanguage);

  return {
    title,
    description,
    alternates: getEnglishOnlyAlternates(pathname),
    robots: { index: language === defaultLanguage, follow: language === defaultLanguage },
    openGraph: { title, description, url: canonicalUrl },
  };
}

export default function AboutUsPage() {
  return (
    <article className="bg-white text-text-primary">
      <header className="border-b border-saffron/15 bg-[#fff8e8] px-4 py-14 text-center md:px-8 md:py-18">
        <span
          aria-hidden="true"
          className="font-devanagari mb-2 block text-4xl leading-none text-saffron"
        >
          {"\u0950"}
        </span>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-saffron">About us</p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Our Story</h1>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <div className="space-y-7 text-base leading-8 text-text-primary/75 sm:text-lg sm:leading-9">
          <p>
            In today&apos;s world, distance and responsibilities can often keep us away from the temples and rituals that hold a special place in our hearts. Yet, our faith remains constant.
          </p>

          <h2 className="pt-2 text-2xl font-bold text-saffron sm:text-3xl">
            That&apos;s Why YAAGAM?
          </h2>

          <p>
            YAAGAM is a devotional platform created to bring prayers closer to the divine, no matter where you are.
          </p>

          <p>
            YAAGAM bridges that distance by making temple poojas, rituals, and devotional offerings accessible from wherever you are.
          </p>

          <p>
            Whether you are away from home, unable to visit a temple, or simply wish to offer a prayer for someone you love, YAAGAM helps you connect with sacred temple traditions in a simple and meaningful way.
          </p>

          <p>
            From poojas and special offerings to traditional rituals, devotees can discover and book offerings conducted at temples, while supporting the sacred practices and traditions that have been passed down through generations.
          </p>

          <div className="mt-10 rounded-2xl bg-[#fff8e8] px-5 py-7 text-center text-lg font-semibold leading-8 text-text-primary sm:px-8 sm:text-xl">
            <p>From your heart to the temple.</p>
            <p className="text-saffron">From the temple to your loved ones.</p>
            <p className="mt-4 text-base font-bold">Because devotion has no distance.</p>
          </div>
        </div>
      </div>
    </article>
  );
}