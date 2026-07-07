import type { Metadata } from "next";

import { PoojaDetailsView } from "@/components/blocks/PoojaDetailsView";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";

const DB_LANGUAGE_BY_APP_LANGUAGE: Record<Language, string> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/poojas/[id]">): Promise<Metadata> {
  const { id, lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = `/poojas/${id}`;

  try {
    const pooja = await getPoojaDetailsApi(id);
    const dbLanguage = DB_LANGUAGE_BY_APP_LANGUAGE[language];
    const translation =
      pooja.translations.find((item) => item.language === dbLanguage) ??
      pooja.translations.find((item) => item.language === "EN") ??
      pooja.translations[0];
    const title = translation?.name ?? "Pooja";
    const description =
      translation?.about ?? "Book authentic temple pooja with Yaagam.";
    const alternates = getSeoAlternates(pathname, language);
    const canonicalUrl = getPublicUrl(pathname, language);

    return {
      title: `${title} | Yaagam`,
      description,
      alternates,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: pooja.imageUrls?.slice(0, 1),
      },
    };
  } catch {
    return {
      title: "Pooja | Yaagam",
      description: "Book authentic temple pooja with Yaagam.",
      alternates: getSeoAlternates(pathname, language),
    };
  }
}

export default async function PoojaDetailsPage({
  params,
}: PageProps<"/[lang]/poojas/[id]">) {
  const { id } = await params;

  return <PoojaDetailsView poojaId={id} />;
}