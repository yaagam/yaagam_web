import type { Metadata } from "next";

import { PoojaDetailsView } from "@/components/blocks/PoojaDetailsView";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";
import {
  getPoojaDetailsApi,
  type PoojaLanguage,
} from "@/lib/api/pooja/poojas.api";
import {
  getLocalizedPoojaImages,
  POOJA_LANGUAGE_BY_UI_LANGUAGE,
} from "@/lib/pooja-images";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/poojas/[id]">): Promise<Metadata> {
  const { id, lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = `/poojas/${id}`;

  try {
    const pooja = await getPoojaDetailsApi(id);
    const dbLanguage: PoojaLanguage =
      POOJA_LANGUAGE_BY_UI_LANGUAGE[language];
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
        images: getLocalizedPoojaImages(pooja, dbLanguage).slice(0, 1),
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