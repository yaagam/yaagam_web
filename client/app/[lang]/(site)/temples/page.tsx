import type { Metadata } from "next";

import { TemplesListContent } from "@/components/blocks/TemplesListContent";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";
import { getTemplesApi, type Temple } from "@/lib/api/temple/temples.api";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/temples">): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = "/temples";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: "Temples of Bharat | Yaagam",
    description:
      "Explore sacred temples of Bharat, their places, traditions, and available poojas on Yaagam.",
    alternates,
    openGraph: {
      title: "Temples of Bharat | Yaagam",
      description: "Discover sacred temples and available poojas with Yaagam.",
      url: canonicalUrl,
    },
  };
}

export default async function TemplesPage() {
  let initialTemples: Temple[] = [];

  try {
    const templesRes = await getTemplesApi({ page: 1, limit: 100 });
    initialTemples = templesRes.items;
  } catch (error) {
    console.error("Failed to load initial temples for Temples page", error);
  }

  return <TemplesListContent temples={initialTemples} />;
}