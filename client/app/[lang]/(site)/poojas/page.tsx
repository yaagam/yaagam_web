import type { Metadata } from "next";

import { PoojasBrowser } from "@/components/blocks/PoojasBrowser";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/poojas">): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = "/poojas";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: "Book Sacred Poojas | Yaagam",
    description:
      "Book authentic Vedic poojas performed by trusted pandits at sacred temples across India.",
    alternates,
    openGraph: {
      title: "Book Sacred Poojas | Yaagam",
      description:
        "Choose authentic temple poojas and receive updates, videos, and prasad from Yaagam.",
      url: canonicalUrl,
    },
  };
}

export default function PoojasPage() {
  return <PoojasBrowser />;
}