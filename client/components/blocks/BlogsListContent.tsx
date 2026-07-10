"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import {
  ArrowRight,
  BookOpen,
  Flower,
  Landmark,
  MapPin,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";

import { APP_ROUTES } from "@/constants/route.const";
import type { Blog } from "@/lib/api/admin/blog/blogs.api";
import type { PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import type { Language } from "@/translations/locales";

type BlogsListContentProps = {
  blogs: Blog[];
  language: Language;
};

type GyanSection = {
  id: "dharmik-gyan" | "pooja-guides" | "temples-of-bharat";
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  blogs: Blog[];
  href?: string;
};

type CategoryTile = {
  title: string;
  href: string;
  image: string;
  icon: ComponentType<{ className?: string }>;
};

const DB_LANGUAGE_BY_UI_LANGUAGE: Record<Language, "EN" | "ML" | "HI" | "MR" | "TA"> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};

const pageCopy = {
  title: "Explore Dharmik Gyan & Sacred Wisdom",
  description:
    "Mantras, aartis, chalisas, temple stories, and timeless wisdom from Hindu scriptures - your daily guide to dharmic living.",
  search: "Search for mantras, temples, poojas",
  viewAll: "View All Blogs",
  read: "Read Gyan",
  readTime: "min read",
  dharmik: "Dharmik Gyan",
  dharmikText: "Learn the significance and history of our timeless spiritual practices.",
  poojas: "Pooja Guides",
  poojasText: "Understand sacred poojas, benefits, vidhi, and temple traditions.",
  temples: "Temples of Bharat",
  templesText: "Most visited pilgrimage sites and their significance.",
  relatedTemple: "Related temple",
  relatedPooja: "Related pooja",
  noBlogs: "No gyan available",
  noBlogsText: "Published gyan will appear here once it is added.",
  noResults: "No matching gyan found.",
  onlyTempleResults:
    "Matching temple articles are available inside Temples of Bharat.",
};

const categoryTiles: CategoryTile[] = [
  { title: "Dharmik Gyan", href: "#dharmik-gyan", image: "/banner.png", icon: Sparkles },
  { title: "Pooja Guides", href: "#pooja-guides", image: "/banner-2.png", icon: Flower },
  { title: "Temples of Bharat", href: APP_ROUTES.gyanTemples, image: "/banner-3.png", icon: Landmark },
  { title: "Astrology", href: "#dharmik-gyan", image: "/nava_graha.png", icon: Sun },
  { title: "Mantras", href: "#dharmik-gyan", image: "/banner-4.png", icon: BookOpen },
];

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

function getReadTime(blog: Blog) {
  const blockCount = blog.blocks?.length ?? 0;
  const textLength = [blog.title, blog.excerpt]
    .concat(
      (blog.blocks ?? []).map((block) =>
        "text" in block && typeof block.text === "string" ? block.text : "",
      ),
    )
    .join(" ").length;

  return Math.max(3, Math.min(12, Math.ceil(textLength / 950) + Math.floor(blockCount / 5)));
}

function getDateLabel(value: string | null | undefined) {
  if (!value) return "Yaagam Gyan";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yaagam Gyan";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function matchesSearch(blog: Blog, language: Language, query: string) {
  if (!query.trim()) return true;

  const localizedBlog = getLocalizedBlog(blog, language);
  const haystack = [localizedBlog.title, localizedBlog.excerpt]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function getBlogRelations(blog: Blog, language: Language) {
  const localizedBlog = getLocalizedBlog(blog, language);
  const dbLanguage = DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const temple = localizedBlog.relatedTemples?.[0] ?? localizedBlog.temples?.[0];
  const pooja = localizedBlog.relatedPoojas?.[0] ?? localizedBlog.poojas?.[0];
  const templeTranslation = getLocalizedTempleTranslation(temple?.translations, dbLanguage);
  const poojaTranslation = getLocalizedPoojaTranslation(pooja?.translations, dbLanguage);
  const templePlace = [templeTranslation?.place, templeTranslation?.district, temple?.state]
    .filter(Boolean)
    .join(", ");

  return { localizedBlog, templeTranslation, poojaTranslation, templePlace };
}

function FeaturedArticle({ blog, language }: { blog: Blog; language: Language }) {
  const { localizedBlog } = getBlogRelations(blog, language);
  const imageUrl = getBlogImage(localizedBlog);

  return (
    <Link
      href={APP_ROUTES.gyanDetails(localizedBlog.slug)}
      className="group grid overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl md:grid-cols-[0.95fr_1.05fr]"
    >
      <div className="relative min-h-64 overflow-hidden bg-[#f8fafc] md:min-h-full">
        <Image
          src={imageUrl}
          alt={localizedBlog.title}
          fill
          priority
          unoptimized={imageUrl.startsWith("http")}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex min-h-64 flex-col justify-end p-5 md:p-7">
        <span className="w-fit rounded-full bg-[#fff4e6] px-3 py-1 text-xs font-extrabold text-saffron">
          {pageCopy.dharmik}
        </span>
        <h2 className="mt-4 line-clamp-3 text-2xl font-extrabold leading-tight text-text-primary md:text-3xl">
          {localizedBlog.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-text-primary/60">
          {localizedBlog.excerpt}
        </p>
        <span className="mt-5 inline-flex items-center text-sm font-extrabold text-saffron">
          {getReadTime(localizedBlog)} {pageCopy.readTime} - {getDateLabel(localizedBlog.publishedAt)}
          <ArrowRight className="motion-arrow-right ml-2 h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function ArticleCard({ blog, language }: { blog: Blog; language: Language }) {
  const { localizedBlog, templeTranslation, poojaTranslation, templePlace } = getBlogRelations(blog, language);
  const imageUrl = getBlogImage(localizedBlog);

  return (
    <article className="w-[286px] shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg md:w-[348px]">
      <Link href={APP_ROUTES.gyanDetails(localizedBlog.slug)} className="block">
        <div className="relative aspect-[1.92] overflow-hidden bg-[#f8fafc]">
          <Image
            src={imageUrl}
            alt={localizedBlog.title}
            fill
            unoptimized={imageUrl.startsWith("http")}
            sizes="310px"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-saffron shadow-sm">
            {templeTranslation ? pageCopy.temples : poojaTranslation ? pageCopy.poojas : pageCopy.dharmik}
          </span>
        </div>
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-3 min-h-[4.5rem] text-base font-extrabold leading-6 text-text-primary">
          {localizedBlog.title}
        </h3>
        <p className="mt-3 text-xs font-bold leading-5 text-text-primary/55">
          {getReadTime(localizedBlog)} {pageCopy.readTime} - {getDateLabel(localizedBlog.publishedAt)}
        </p>
        {templeTranslation && templePlace && (
          <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-text-primary/55">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron" />
            <span className="line-clamp-2">{templePlace}</span>
          </p>
        )}
      </div>
    </article>
  );
}

function SectionHeader({ section }: { section: GyanSection }) {
  const Icon = section.icon;

  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold leading-tight text-text-primary md:text-3xl">
          <Icon className="h-6 w-6 shrink-0 text-saffron" />
          <span className="min-w-0 text-wrap-safe">{section.title}</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-primary/60">
          {section.description}
        </p>
      </div>
      <Link
        href={section.href ?? `#${section.id}`}
        className="hidden min-h-10 shrink-0 items-center rounded-full border border-saffron/30 px-4 text-sm font-extrabold text-saffron transition-colors hover:bg-saffron hover:text-white sm:inline-flex"
      >
        {pageCopy.viewAll}
        <ArrowRight className="motion-arrow-right ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

function GyanSectionRow({ section, language }: { section: GyanSection; language: Language }) {
  const visibleBlogs = section.blogs.slice(0, 10);

  if (visibleBlogs.length === 0) return null;

  return (
    <section id={section.id} className="scroll-mt-24">
      <SectionHeader section={section} />
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 md:-mx-8 md:px-8 xl:mx-0 xl:px-0">
        {visibleBlogs.map((blog) => (
          <ArticleCard key={`${section.id}-${blog.id}`} blog={blog} language={language} />
        ))}
      </div>
    </section>
  );
}

export function BlogsListContent({ blogs, language }: BlogsListContentProps) {
  const [query, setQuery] = useState("");
  const filteredBlogs = useMemo(
    () => blogs.filter((blog) => matchesSearch(blog, language, query)),
    [blogs, language, query],
  );
  const templeBlogs = filteredBlogs.filter(
    (blog) =>
      (blog.relatedTemples?.length ?? 0) > 0 ||
      (blog.temples?.length ?? 0) > 0 ||
      blog.templeIds.length > 0,
  );
  const gyanBlogs = filteredBlogs.filter((blog) => !templeBlogs.includes(blog));
  const poojaBlogs = gyanBlogs.filter(
    (blog) =>
      (blog.relatedPoojas?.length ?? 0) > 0 ||
      (blog.poojas?.length ?? 0) > 0 ||
      blog.poojaIds.length > 0,
  );
  const generalBlogs = gyanBlogs.filter((blog) => !poojaBlogs.includes(blog));
  const dharmikBlogs = generalBlogs.length > 0 ? generalBlogs : gyanBlogs;
  const sections: GyanSection[] = [
    {
      id: "dharmik-gyan",
      title: pageCopy.dharmik,
      description: pageCopy.dharmikText,
      icon: Sparkles,
      blogs: dharmikBlogs,
    },
    {
      id: "pooja-guides",
      title: pageCopy.poojas,
      description: pageCopy.poojasText,
      icon: Flower,
      blogs: poojaBlogs,
    },
  ];
  const templeSection: GyanSection = {
    id: "temples-of-bharat",
    title: pageCopy.temples,
    description: pageCopy.templesText,
    icon: Landmark,
    blogs: templeBlogs,
    href: APP_ROUTES.gyanTemples,
  };
  const featuredBlog = gyanBlogs[0];

  return (
    <main className="bg-white pb-20 text-text-primary">
      <section className="bg-[#fff8f2]">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 text-center md:px-8 lg:pb-10 lg:pt-14">
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
            {pageCopy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-text-primary/65 md:text-base md:leading-7">
            {pageCopy.description}
          </p>
          <label className="mx-auto mt-7 flex min-h-13 max-w-2xl items-center gap-3 rounded-full border border-black/10 bg-white px-4 text-left shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-saffron" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={pageCopy.search}
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-text-primary outline-none placeholder:text-text-primary/40"
            />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 md:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categoryTiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <Link
                key={tile.title}
                href={tile.href}
                className="group overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[1.25] overflow-hidden bg-[#fff8f2]">
                  <Image
                    src={tile.image}
                    alt={tile.title}
                    fill
                    sizes="(min-width: 1024px) 240px, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-saffron shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <span className="block px-3 py-3 text-sm font-extrabold text-text-primary">
                  {tile.title}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        {blogs.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
            <BookOpen className="h-9 w-9 text-text-primary/35" />
            <p className="mt-3 text-lg font-extrabold text-text-primary">
              {pageCopy.noBlogs}
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
              {pageCopy.noBlogsText}
            </p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 bg-[#f8fafc] px-4 py-10 text-center text-sm font-bold text-text-primary/55">
            {pageCopy.noResults}
          </div>
        ) : (
          <div className="space-y-12">
            {featuredBlog && <FeaturedArticle blog={featuredBlog} language={language} />}
            {sections.map((section) => (
              <GyanSectionRow key={section.id} section={section} language={language} />
            ))}
            <GyanSectionRow section={templeSection} language={language} />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 border-t border-black/10 pt-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary">
              Yaagam Gyan - Hindu Mantras, Temples & Mythological Wisdom
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-text-primary/65">
              Yaagam Gyan brings sacred Hindu knowledge into a simple reading experience. Explore temple histories, pooja practices, festivals, mantras, and spiritual ideas rooted in Sanatana Dharma.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "What is Dharmik Gyan?",
              "How do mantras support daily sadhana?",
              "Which temples can I explore on Yaagam?",
              "How can I learn the meaning of a pooja?",
            ].map((question) => (
              <div key={question} className="rounded-lg border border-black/10 bg-[#fff8f2] p-4 text-sm font-extrabold text-text-primary">
                {question}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}