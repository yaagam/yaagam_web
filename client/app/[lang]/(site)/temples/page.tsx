import type { Metadata } from "next";

import { TemplesListContent } from "@/components/blocks/TemplesListContent";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";
import { getAdminTemplesApi } from "@/lib/api/admin/temple/temples.api";

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
      "Explore sacred temples, their stories, and available poojas on Yaagam.",
    alternates,
    openGraph: {
      title: "Temples of Bharat | Yaagam",
      description:
        "Discover sacred temples and book authentic temple poojas with Yaagam.",
      url: canonicalUrl,
    },
  };
}

async function getTemplesPageData() {
  try {
    const templesResponse = await getAdminTemplesApi({ limit: 100 });
    return templesResponse.items;
  } catch {
    return [];
  }
}

export default async function TemplesPage() {
  const temples = await getTemplesPageData();

  return <TemplesListContent temples={temples} />;
}