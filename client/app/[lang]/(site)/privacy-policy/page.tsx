import type { Metadata } from "next";

import { LegalPolicyPage } from "@/components/blocks/LegalPolicyPage";
import { legalPages } from "@/constants/legal-pages.const";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, defaultLanguage, type Language } from "@/translations/locales";

const content = legalPages.privacy;
const pathname = "/privacy-policy";
const pageTitle = content.title + " | Yaagam";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : defaultLanguage;
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: pageTitle,
    description: content.description,
    alternates: getSeoAlternates(pathname, language),
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