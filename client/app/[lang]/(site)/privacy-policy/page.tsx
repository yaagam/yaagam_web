import type { Metadata } from "next";

import { LegalPolicyPage } from "@/components/blocks/LegalPolicyPage";
import { legalPages } from "@/constants/legal-pages.const";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

const content = legalPages.privacy;
const pathname = "/privacy-policy";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy-policy">): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: `${content.title} | Yaagam`,
    description: content.description,
    alternates,
    openGraph: {
      title: `${content.title} | Yaagam`,
      description: content.description,
      url: canonicalUrl,
    },
  };
}

export default function Page() {
  return <LegalPolicyPage {...content} />;
}