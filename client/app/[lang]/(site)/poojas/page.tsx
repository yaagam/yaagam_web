import type { Metadata } from "next";

import { PoojasBrowser } from "@/components/blocks/PoojasBrowser";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";
import { getPoojasApi, type Pooja, type PoojasMeta } from "@/lib/api/pooja/poojas.api";
import { getTemplesApi, type Temple } from "@/lib/api/temple/temples.api";
import { getBenifitsApi, type Benifit } from "@/lib/api/benifit/benifits.api";
import { POOJAS_PAGE_SIZE } from "@/constants/poojas-browser.const";

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

export default async function PoojasPage() {
  let initialPoojas: Pooja[] = [];
  let initialMeta: PoojasMeta | undefined;
  let initialTemples: Temple[] = [];
  let initialBenifits: Benifit[] = [];
  let initialError = "";

  try {
    const [poojasRes, templesRes, benifitsRes] = await Promise.all([
      getPoojasApi({ page: 1, limit: POOJAS_PAGE_SIZE }),
      getTemplesApi({ page: 1, limit: 100 }),
      getBenifitsApi({ page: 1, limit: 100 }),
    ]);

    initialPoojas = poojasRes.items;
    initialMeta = poojasRes.meta;
    initialTemples = templesRes.items;
    initialBenifits = benifitsRes.items;
  } catch (error) {
    initialError = "Failed to load poojas";
    console.error("Failed to load initial data for Poojas page", error);
  }

  return (
    <PoojasBrowser
      initialPoojas={initialPoojas}
      initialMeta={initialMeta}
      initialTemples={initialTemples}
      initialBenifits={initialBenifits}
      initialError={initialError}
    />
  );
}