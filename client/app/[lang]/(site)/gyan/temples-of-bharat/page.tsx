import type { Metadata } from "next";

import { TemplesListContent } from "@/components/blocks/TemplesListContent";
import { getAdminTemplesApi } from "@/lib/api/admin/temple/temples.api";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/gyan/temples-of-bharat">): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = "/gyan/temples-of-bharat";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: "Temples of Bharat | Yaagam Gyan",
    description:
      "Explore sacred temples of Bharat, their stories, places, and significance on Yaagam.",
    alternates,
    openGraph: {
      title: "Temples of Bharat | Yaagam Gyan",
      description:
        "Discover sacred temples and their significance with Yaagam Gyan.",
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

export default async function TemplesOfBharatPage() {
  const temples = await getTemplesPageData();

  return <TemplesListContent temples={temples} />;
}