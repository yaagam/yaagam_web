import type { Metadata } from "next";

import { LegalPolicyPage } from "@/components/blocks/LegalPolicyPage";
import { legalPages } from "@/constants/legal-pages.const";
import { getEnglishOnlyAlternates, getPublicUrl } from "@/translations/metadata";
import { isLanguage, defaultLanguage, type Language } from "@/translations/locales";

const content = legalPages.terms;
const pathname = "/terms-and-conditions";
const pageTitle = content.title + " | Yaagam";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : defaultLanguage;
  const canonicalUrl = getPublicUrl(pathname, defaultLanguage);

  return {
    title: pageTitle,
    description: content.description,
    alternates: getEnglishOnlyAlternates(pathname),
    robots: {
      index: language === defaultLanguage,
      follow: language === defaultLanguage,
    },
    openGraph: {
      title: pageTitle,
      description: content.description,
      url: canonicalUrl,
    },
  };
}

export default function Page() {
  return <LegalPolicyPage {...content} />;
}