import type { Metadata } from "next";

import { BlogsListContent } from "@/components/blocks/BlogsListContent";
import { getAdminBlogsApi } from "@/lib/api/admin/blog/blogs.api";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/gyan">): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = "/gyan";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: "Dharmik Gyan | Yaagam",
    description:
      "Explore dharmik gyan, temple stories, pooja guides, and sacred wisdom from Yaagam.",
    alternates,
    openGraph: {
      title: "Dharmik Gyan | Yaagam",
      description:
        "Read temple stories, pooja guides, and sacred articles on Yaagam.",
      url: canonicalUrl,
    },
  };
}

async function getGyanPageData() {
  try {
    const blogsResponse = await getAdminBlogsApi({
      limit: 100,
      status: "published",
      sortBy: "publishedAt",
      sortOrder: "desc",
    });

    return blogsResponse.items;
  } catch {
    return [];
  }
}

export default async function GyanPage({
  params,
}: PageProps<"/[lang]/gyan">) {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const blogs = await getGyanPageData();

  return <BlogsListContent blogs={blogs} language={language} />;
}