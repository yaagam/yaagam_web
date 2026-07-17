import type { Metadata } from "next";

import { TemplesListContent } from "@/components/blocks/TemplesListContent";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

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

export default function TemplesPage() {
  return <TemplesListContent />;
}