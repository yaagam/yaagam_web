import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { ArrowRight, BookOpen, Flower, Landmark, MapPin } from "lucide-react";

import { APP_ROUTES } from "@/constants/route.const";
import type { Blog } from "@/lib/api/admin/blog/blogs.api";
import type { PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import type { Language } from "@/translations/locales";

type BlogsListContentProps = {
  blogs: Blog[];
  language: Language;
};

type BlogCategory = {
  id: "all" | "temples" | "poojas";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  blogs: Blog[];
};

const DB_LANGUAGE_BY_UI_LANGUAGE: Record<Language, "EN" | "ML" | "HI" | "MR" | "TA"> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};

const pageCopy = {
  eyebrow: "Yaagam Blogs",
  title: "Temple stories, pooja guides, and dharmik knowledge",
  description:
    "Read detailed temple articles, understand sacred poojas, and explore spiritual guidance in your preferred language.",
  all: "All Blogs",
  allText: "Every published guide and article from Yaagam.",
  temples: "About Temple",
  templesText: "Temple history, location, significance, and related poojas.",
  poojas: "About Pooja",
  poojasText: "Pooja meanings, benefits, process, and booking guidance.",
  read: "Read blog",
  relatedTemple: "Related temple",
  relatedPooja: "Related pooja",
  noBlogs: "No blogs available",
  noBlogsText: "Published blogs will appear here once they are added.",
  emptyCategory: "No articles in this category yet.",
};

function getLocalizedBlog(blog: Blog, language: Language) {
  const dbLanguage = DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const translation =
    blog.translations?.find((item) => item.language === dbLanguage) ??
    blog.translations?.find((item) => item.language === "EN") ??
    blog.translations?.[0] ??
    null;

  if (!translation) return blog;

  return {
    ...blog,
    title: translation.title || blog.title,
    excerpt: translation.excerpt || blog.excerpt,
    metaTitle: translation.metaTitle ?? blog.metaTitle,
    metaDescription: translation.metaDescription ?? blog.metaDescription,
    blocks: translation.blocks?.length ? translation.blocks : blog.blocks,
  };
}

function getLocalizedTempleTranslation(
  translations: TempleTranslation[] | undefined,
  language: TempleTranslation["language"],
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
    null
  );
}

function getLocalizedPoojaTranslation(
  translations: PoojaTranslation[] | undefined,
  language: PoojaTranslation["language"],
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
    null
  );
}

function getApiImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return "";
  if (/^(?:https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith("/")) return imageUrl;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return imageUrl;

  try {
    return new URL(imageUrl, apiBaseUrl).toString();
  } catch {
    return imageUrl;
  }
}

function getBlogImage(blog: Blog) {
  return (
    getApiImageUrl(blog.featuredImageUrl) ||
    getApiImageUrl(blog.relatedTemples?.[0]?.imageUrl ?? blog.temples?.[0]?.imageUrl) ||
    "/banner.png"
  );
}

function BlogCard({ blog, language }: { blog: Blog; language: Language }) {
  const localizedBlog = getLocalizedBlog(blog, language);
  const dbLanguage = DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const temple = localizedBlog.relatedTemples?.[0] ?? localizedBlog.temples?.[0];
  const pooja = localizedBlog.relatedPoojas?.[0] ?? localizedBlog.poojas?.[0];
  const templeTranslation = getLocalizedTempleTranslation(
    temple?.translations,
    dbLanguage,
  );
  const poojaTranslation = getLocalizedPoojaTranslation(
    pooja?.translations,
    dbLanguage,
  );
  const templePlace = [
    templeTranslation?.place,
    templeTranslation?.district,
    temple?.state,
  ]
    .filter(Boolean)
    .join(", ");
  const imageUrl = getBlogImage(localizedBlog);

  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={APP_ROUTES.blogDetails(localizedBlog.slug)} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#f8fafc]">
          <Image
            src={imageUrl}
            alt={localizedBlog.title}
            fill
            unoptimized={imageUrl.startsWith("http")}
            sizes="(min-width: 1280px) 390px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {templeTranslation && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-black/10 bg-[#fff8f2] px-3 py-1 text-xs font-extrabold text-text-primary/65">
              <Landmark className="h-3.5 w-3.5 text-saffron" />
              {pageCopy.relatedTemple}
            </span>
          )}
          {poojaTranslation && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-black/10 bg-[#f5fff8] px-3 py-1 text-xs font-extrabold text-text-primary/65">
              <Flower className="h-3.5 w-3.5 text-[#149149]" />
              {pageCopy.relatedPooja}
            </span>
          )}
        </div>

        <h2 className="mt-4 line-clamp-2 text-xl font-extrabold leading-7 text-text-primary">
          {localizedBlog.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-text-primary/60">
          {localizedBlog.excerpt}
        </p>

        {templeTranslation && (
          <div className="mt-4 rounded-md bg-[#f8fafc] p-3">
            <p className="text-sm font-extrabold text-text-primary">
              {templeTranslation.name}
            </p>
            {templePlace && (
              <p className="mt-1 flex items-start gap-2 text-xs font-bold leading-5 text-text-primary/55">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
                <span className="line-clamp-2">{templePlace}</span>
              </p>
            )}
          </div>
        )}

        <Link
          href={APP_ROUTES.blogDetails(localizedBlog.slug)}
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-saffron px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#d96e13]"
        >
          {pageCopy.read}
          <ArrowRight className="motion-arrow-right ml-2 h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function CategorySection({ category, language }: { category: BlogCategory; language: Language }) {
  const Icon = category.icon;

  return (
    <section id={category.id} className="scroll-mt-24">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            <Icon className="h-4 w-4" />
            {category.title}
          </p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-primary/60">
            {category.description}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-extrabold text-text-primary/55">
          {category.blogs.length} articles
        </span>
      </div>

      {category.blogs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {category.blogs.map((blog) => (
            <BlogCard key={`${category.id}-${blog.id}`} blog={blog} language={language} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-black/15 bg-[#f8fafc] px-4 py-10 text-center text-sm font-bold text-text-primary/55">
          {pageCopy.emptyCategory}
        </div>
      )}
    </section>
  );
}

export function BlogsListContent({ blogs, language }: BlogsListContentProps) {
  const templeBlogs = blogs.filter(
    (blog) =>
      (blog.relatedTemples?.length ?? 0) > 0 ||
      (blog.temples?.length ?? 0) > 0 ||
      blog.templeIds.length > 0,
  );
  const poojaBlogs = blogs.filter(
    (blog) =>
      (blog.relatedPoojas?.length ?? 0) > 0 ||
      (blog.poojas?.length ?? 0) > 0 ||
      blog.poojaIds.length > 0,
  );
  const categories: BlogCategory[] = [
    {
      id: "all",
      title: pageCopy.all,
      description: pageCopy.allText,
      icon: BookOpen,
      blogs,
    },
    {
      id: "temples",
      title: pageCopy.temples,
      description: pageCopy.templesText,
      icon: Landmark,
      blogs: templeBlogs,
    },
    {
      id: "poojas",
      title: pageCopy.poojas,
      description: pageCopy.poojasText,
      icon: Flower,
      blogs: poojaBlogs,
    },
  ];

  return (
    <main className="bg-white pb-20 text-text-primary">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            <BookOpen className="h-4 w-4" />
            {pageCopy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {pageCopy.title}
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-text-primary/65 md:text-base md:leading-7">
            {pageCopy.description}
          </p>
        </div>

        <div className="mb-10 grid gap-3 md:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="rounded-lg border border-black/10 bg-[#f8fafc] p-4 transition-colors hover:border-saffron hover:bg-[#fff8f2]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-saffron shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-base font-extrabold text-text-primary">
                  {category.title}
                </h2>
                <p className="mt-1 text-xs font-bold leading-5 text-text-primary/55">
                  {category.blogs.length} articles
                </p>
              </a>
            );
          })}
        </div>

        {blogs.length > 0 ? (
          <div className="space-y-14">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                language={language}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <BookOpen className="h-9 w-9 text-text-primary/35" />
            <p className="mt-3 text-lg font-extrabold text-text-primary">
              {pageCopy.noBlogs}
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
              {pageCopy.noBlogsText}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}