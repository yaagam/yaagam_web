import type { Metadata } from "next";

import { LegalPolicyPage } from "@/components/blocks/LegalPolicyPage";
import { legalPages } from "@/constants/legal-pages.const";
import { getPublicUrl } from "@/translations/metadata";

const content = legalPages.privacy;
const pathname = "/privacy-policy";
const canonicalUrl = getPublicUrl(pathname, "en");
const pageTitle = content.title + " | Yaagam";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: pageTitle,
  description: content.description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: pageTitle,
    description: content.description,
    url: canonicalUrl,
  },
};

export default function Page() {
  return <LegalPolicyPage {...content} />;
}