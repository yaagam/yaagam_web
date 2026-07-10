"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { CalendarDays, Landmark, MapPin, Share2 } from "lucide-react";

import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";
import { PoojaCard } from "@/components/blocks/PoojaCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { APP_ROUTES } from "@/constants/route.const";
import type { Blog } from "@/lib/api/admin/blog/blogs.api";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type {
  Temple,
  TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";
import { POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE } from "@/constants/poojas-browser.const";

type DbLanguage = TempleTranslation["language"];

type TempleDetailsContentProps = {
  temple: Temple;
  poojas: Pooja[];
  blogs: Blog[];
};

function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[] | undefined,
  language: DbLanguage,
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
    null
  );
}

function getLocalizedBlog(blog: Blog, language: DbLanguage) {
  const translation = getLocalizedTranslation(blog.translations, language);

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
  return getApiImageUrl(blog.featuredImageUrl);
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDateLabel(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getReadTime(blog: Blog) {
  const textLength = [blog.title, blog.excerpt]
    .concat(
      (blog.blocks ?? []).map((block) =>
        "text" in block && typeof block.text === "string" ? block.text : "",
      ),
    )
    .join(" ").length;

  return Math.max(3, Math.min(12, Math.ceil(textLength / 950)));
}

function ArticleMeta({ blog }: { blog: Blog }) {
  const dateLabel = getDateLabel(blog.publishedAt);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-text-primary/60">
      {blog.author && <span>{blog.author}</span>}
      {blog.author && dateLabel && <span>|</span>}
      {dateLabel && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-saffron" />
          {dateLabel}
        </span>
      )}
      {(blog.author || dateLabel) && <span>|</span>}
      <span>{getReadTime(blog)} min read</span>
    </div>
  );
}

function ArticleBody({ blog, index }: { blog: Blog; index: number }) {
  const imageUrl = getBlogImage(blog);

  return (
    <article className={index === 0 ? "" : "mt-10 border-t border-black/10 pt-8 text-left"}>
      {index > 0 && (
        <h2 className="text-xl font-extrabold leading-tight text-text-primary md:text-2xl">
          {blog.title}
        </h2>
      )}

      {index > 0 && <ArticleMeta blog={blog} />}

      {index > 0 && blog.excerpt && (
        <p className="mt-5 text-lg font-medium leading-8 text-text-primary/75">
          {blog.excerpt}
        </p>
      )}

      {imageUrl && (
        <figure className="my-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-black/5">
            <Image
              src={imageUrl}
              alt={blog.title}
              fill
              priority={index === 0}
              unoptimized={imageUrl.startsWith("http")}
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      )}

      {blog.blocks.length > 0 && (
        <div className="mt-6">
          <BlogBlockRenderer blocks={blog.blocks} />
        </div>
      )}
    </article>
  );
}

function TempleIntro({
  imageUrl,
  place,
  title,
  translation,
}: {
  imageUrl: string;
  place: string;
  title: string;
  translation: TempleTranslation | null;
}) {
  return (
    <section className="text-left">
      <h1 className="text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">
        {title}
      </h1>

      {place && (
        <p className="mt-4 flex items-start gap-2 text-sm font-semibold leading-6 text-text-primary/65">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
          <span>{place}</span>
        </p>
      )}

      <figure className="my-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-black/5">
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            unoptimized={imageUrl.startsWith("http")}
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      </figure>

      {translation?.description && (
        <p className="text-lg font-medium leading-9 text-text-primary/75 md:text-xl md:leading-10">
          {translation.description}
        </p>
      )}
    </section>
  );
}

function ArticleTempleDetails({
  blogs,
  place,
  templeImageUrl,
  title,
  translation,
}: {
  blogs: Blog[];
  place: string;
  templeImageUrl: string;
  title: string;
  translation: TempleTranslation | null;
}) {
  const firstBlog = blogs[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14 [&>*]:max-w-[780px]">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-text-primary/55">
        <Link href={APP_ROUTES.gyan} className="hover:text-saffron">
          Gyan
        </Link>
        <span>/</span>
        <Link href={APP_ROUTES.gyanTemples} className="hover:text-saffron">
          Temples Of Bharat
        </Link>
        <span>/</span>
        <span className="text-text-primary">{title}</span>
      </nav>

      <TempleIntro
        imageUrl={templeImageUrl}
        place={place}
        title={title}
        translation={translation}
      />

      <div className="mt-10 border-t border-black/10 pt-8 text-left">
        <header>
          <h2 className="text-xl font-extrabold leading-tight text-text-primary md:text-2xl">
            {firstBlog.title}
          </h2>
          <ArticleMeta blog={firstBlog} />
          {firstBlog.excerpt && (
            <p className="mt-6 text-lg font-medium leading-8 text-text-primary/75 md:text-xl md:leading-9">
              {firstBlog.excerpt}
            </p>
          )}
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-text-primary/45">
            <Share2 className="h-4 w-4" />
            Share
          </div>
        </header>

        {blogs.map((blog, index) => (
          <ArticleBody key={blog.id} blog={blog} index={index} />
        ))}
      </div>
    </section>
  );
}

function PlainTempleDetails({
  imageUrl,
  place,
  poojas,
  selectedDbLanguage,
  title,
  translation,
}: {
  imageUrl: string;
  place: string;
  poojas: Pooja[];
  selectedDbLanguage: DbLanguage;
  title: string;
  translation: TempleTranslation | null;
}) {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14 [&>*]:max-w-[780px]">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-text-primary/55">
          <Link href={APP_ROUTES.gyan} className="hover:text-saffron">
            Gyan
          </Link>
          <span>/</span>
          <Link href={APP_ROUTES.gyanTemples} className="hover:text-saffron">
            Temples Of Bharat
          </Link>
          <span>/</span>
          <span className="text-text-primary">{title}</span>
        </nav>

        <TempleIntro
          imageUrl={imageUrl}
          place={place}
          title={title}
          translation={translation}
        />
      </section>
      <TemplePoojasSection
        poojas={poojas}
        selectedDbLanguage={selectedDbLanguage}
        title={title}
      />
    </>
  );
}

function TemplePoojasSection({
  poojas,
  selectedDbLanguage,
  title,
}: {
  poojas: Pooja[];
  selectedDbLanguage: DbLanguage;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-7xl border-t border-black/10 px-4 pt-10 md:px-8 [&>*]:max-w-[780px]">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary">
            Poojas at {title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-text-primary/60">
            Browse available rituals from this temple.
          </p>
        </div>
      </div>

      {poojas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_article>div:first-child]:aspect-[4/3] [&_article>div:last-child]:p-3 [&_article_h2]:mt-3 [&_article_h2]:text-base [&_article_h2]:leading-6 [&_article_p]:text-xs [&_article_p]:leading-5 [&_article_button]:min-h-9 [&_article_button]:px-3 [&_article_button]:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5">
          {poojas.map((pooja) => {
            const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
              pooja.translations,
              selectedDbLanguage,
            );
            const poojaImage = pooja.imageUrls?.[0] ?? "/chandra_graha.png";

            return (
              <PoojaCard
                key={pooja.id}
                title={poojaTranslation?.name ?? "Untitled pooja"}
                price={formatAmount(pooja.baseAmount)}
                image={poojaImage}
                dayBadge={pooja.poojaDay}
                category={pooja.isWeekly ? "Weekly" : "Normal"}
                href={APP_ROUTES.poojaDetails(pooja.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-black/10 bg-[#f8fafc] px-4 py-10 text-center">
          <Landmark className="h-9 w-9 text-text-primary/35" />
          <p className="mt-3 text-lg font-extrabold text-text-primary">
            No poojas found
          </p>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-primary/60">
            Poojas for this temple will appear here once they are available.
          </p>
        </div>
      )}
    </section>
  );
}

export function TempleDetailsContent({
  temple,
  poojas,
  blogs,
}: TempleDetailsContentProps) {
  const { language } = useLanguage();
  const selectedDbLanguage = POOJAS_BROWSER_DB_LANGUAGE_BY_UI_LANGUAGE[language];
  const translation = getLocalizedTranslation<TempleTranslation>(
    temple.translations,
    selectedDbLanguage,
  );
  const imageUrl = getApiImageUrl(temple.imageUrl) || "/banner.png";
  const title = translation?.name ?? "Temple";
  const place = [translation?.place, translation?.district, temple.state]
    .filter(Boolean)
    .join(", ");
  const localizedBlogs = blogs.map((blog) =>
    getLocalizedBlog(blog, selectedDbLanguage),
  );

  return (
    <main className="bg-white pb-16 text-text-primary">
      {localizedBlogs.length > 0 ? (
        <>
          <ArticleTempleDetails
            blogs={localizedBlogs}
            place={place}
            templeImageUrl={imageUrl}
            title={title}
            translation={translation}
          />
          <TemplePoojasSection
            poojas={poojas}
            selectedDbLanguage={selectedDbLanguage}
            title={title}
          />
        </>
      ) : (
        <PlainTempleDetails
          imageUrl={imageUrl}
          place={place}
          poojas={poojas}
          selectedDbLanguage={selectedDbLanguage}
          title={title}
          translation={translation}
        />
      )}
    </main>
  );
}