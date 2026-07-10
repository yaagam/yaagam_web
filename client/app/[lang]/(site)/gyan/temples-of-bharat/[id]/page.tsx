import type { Metadata } from "next";

import { TempleDetailsContent } from "@/components/blocks/TempleDetailsContent";
import { getAdminBlogsApi } from "@/lib/api/admin/blog/blogs.api";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getTempleDetailsApi } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

const DB_LANGUAGE_BY_APP_LANGUAGE: Record<Language, string> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

type TempleDetailsPageProps = PageProps<"/[lang]/gyan/temples-of-bharat/[id]">;

export async function generateMetadata({
  params,
}: TempleDetailsPageProps): Promise<Metadata> {
  const { id, lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = `/gyan/temples-of-bharat/${id}`;

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
    const alternates = getSeoAlternates(pathname, language);
    const canonicalUrl = getPublicUrl(pathname, language);

    return {
      title: `${title} | Yaagam Gyan`,
      description,
      alternates,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: temple.imageUrl ? [temple.imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Temple | Yaagam Gyan",
      description: "Learn more about temples on Yaagam.",
      alternates: getSeoAlternates(pathname, language),
    };
  }
}

export default async function GyanTempleDetailsPage({
  params,
}: TempleDetailsPageProps) {
  const { id } = await params;
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
      blogs={loadResult.blogs}
    />
  );
}

async function loadTemplePageData(id: string) {
  try {
    const [temple, poojaResponse, blogsResponse] = await Promise.all([
      getTempleDetailsApi(id),
      getPoojasApi({ page: 1, limit: 12, templeId: id }),
      getAdminBlogsApi({
        limit: 100,
        status: "published",
        sortBy: "publishedAt",
        sortOrder: "desc",
      }),
    ]);
    const blogs = blogsResponse.items.filter(
      (blog) =>
        blog.templeIds.includes(id) ||
        (blog.relatedTemples ?? blog.temples ?? []).some((item) => item.id === id),
    );

    return {
      ok: true as const,
      temple,
      poojas: poojaResponse.items,
      blogs,
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      error: getErrorMessage(
        error,
        "Temple details failed. Please try again.",
      ),
    };
  }
}