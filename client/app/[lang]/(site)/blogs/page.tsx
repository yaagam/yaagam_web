import type { Metadata } from "next";

import { BlogsListContent } from "@/components/blocks/BlogsListContent";
import { getAdminBlogsApi } from "@/lib/api/admin/blog/blogs.api";
import { getPublicUrl, getSeoAlternates } from "@/translations/metadata";
import { isLanguage, type Language } from "@/translations/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const pathname = "/blogs";
  const alternates = getSeoAlternates(pathname, language);
  const canonicalUrl = getPublicUrl(pathname, language);

  return {
    title: "Blogs | Yaagam",
    description:
      "Read temple stories, pooja guides, and dharmik knowledge from Yaagam.",
    alternates,
    openGraph: {
      title: "Blogs | Yaagam",
      description:
        "Explore temple details, pooja guides, and spiritual articles on Yaagam.",
      url: canonicalUrl,
    },
  };
}

async function getBlogsPageData() {
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

export default async function BlogsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : "en";
  const blogs = await getBlogsPageData();

  return <BlogsListContent blogs={blogs} language={language} />;
}