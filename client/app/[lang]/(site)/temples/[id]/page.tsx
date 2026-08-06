import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TempleDetailsContent } from "@/components/blocks/TempleDetailsContent";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getTempleDetailsApi } from "@/lib/api/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";
import { getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

function isValidTempleId(id: string) {
  const value = id.trim();
  return Boolean(value && value !== "undefined" && value !== "null");
}

const DB_LANGUAGE_BY_APP_LANGUAGE: Record<Language, string> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

type TempleDetailsPageProps = PageProps<"/[lang]/temples/[id]">;

export async function generateMetadata({
  params,
}: TempleDetailsPageProps): Promise<Metadata> {
  const { id, lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = `/temples/${id}`;

  if (!isValidTempleId(id)) {
    return { title: "Temple not found | Yaagam", robots: { index: false, follow: false } };
  }

  try {
    const temple = await getTempleDetailsApi(id);
    const dbLanguage = DB_LANGUAGE_BY_APP_LANGUAGE[language];
    const translation =
      temple.translations.find((item) => item.language === dbLanguage) ??
      temple.translations.find((item) => item.language === "EN") ??
      temple.translations[0];
    const title = translation?.name ?? "Temple";
    const description =
      translation?.description ?? "Learn more about this temple on Yaagam.";

    return {
      title: `${title} | Yaagam`,
      description,
      alternates: getSeoAlternates(pathname, language),
      openGraph: {
        title,
        description,
        images: temple.heroImageUrl ? [temple.heroImageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Temple | Yaagam",
      description: "Learn more about temples on Yaagam.",
      alternates: getSeoAlternates(pathname, language),
    };
  }
}

export default async function TempleDetailsPage({
  params,
}: TempleDetailsPageProps) {
  const { id } = await params;

  if (!isValidTempleId(id)) notFound();

  const loadResult = await loadTemplePageData(id);

  if (!loadResult.ok) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-text-primary">
          Could not load temple
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {loadResult.error}
        </p>
      </section>
    );
  }

  return (
    <TempleDetailsContent
      temple={loadResult.temple}
      poojas={loadResult.poojas}
    />
  );
}

async function loadTemplePageData(id: string) {
  try {
    const [temple, poojaResponse] = await Promise.all([
      getTempleDetailsApi(id),
      getPoojasApi({ page: 1, limit: 12, templeSlug: id }),
    ]);

    return {
      ok: true as const,
      temple,
      poojas: poojaResponse.items,
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      error: getErrorMessage(error, "Temple details failed. Please try again."),
    };
  }
}
