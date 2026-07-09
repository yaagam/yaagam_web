import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { CalendarDays, Share2 } from "lucide-react";

import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";
import {
  getAdminBlogsApi,
  getBlogDetailsApi,
  type Blog,
} from "@/lib/api/admin/blog/blogs.api";
import type { PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

type BlogDetailsViewProps = {
  blogIdOrSlug: string;
  isPreview?: boolean;
  language?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPrimaryTempleTranslation(translations: TempleTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getPrimaryPoojaTranslation(translations: PoojaTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getLocalizedBlog(blog: Blog, language?: string) {
  const languageMap: Record<string, string> = {
    en: "EN",
    ml: "ML",
    hi: "HI",
    mr: "MR",
    ta: "TA",
  };
  const dbLanguage = languageMap[language ?? ""] ?? "EN";
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

function SocialShare({ blog }: { blog: Blog }) {
  const sharePath = APP_ROUTES.blogDetails(blog.slug);
  const shareText = encodeURIComponent(blog.title);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-text-primary/45">
        <Share2 className="h-4 w-4" />
        Share
      </span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${sharePath}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-text-primary/60 transition-colors hover:border-saffron hover:text-saffron"
        aria-label="Share on Facebook"
      >
        f
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${sharePath}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-text-primary/60 transition-colors hover:border-saffron hover:text-saffron"
        aria-label="Share on LinkedIn"
      >
        in
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${sharePath}`}
        className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-4 text-xs font-extrabold text-text-primary/60 transition-colors hover:border-saffron hover:text-saffron"
      >
        X
      </a>
    </div>
  );
}

function RelatedSection({ blog }: { blog: Blog }) {
  const temples = blog.temples ?? [];
  const poojas = blog.poojas ?? [];
  const relatedBlogs = blog.relatedBlogs ?? [];

  if (
    temples.length === 0 &&
    poojas.length === 0 &&
    relatedBlogs.length === 0
  ) {
    return null;
  }

  return (
    <aside className="mx-auto mt-14 grid max-w-5xl gap-6 px-4 pb-16 md:px-8 lg:grid-cols-3">
      {temples.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-text-primary">
            Related Temples
          </h2>
          <div className="mt-4 space-y-3">
            {temples.map((temple) => {
              const translation = getPrimaryTempleTranslation(
                temple.translations,
              );

              return (
                <Link
                  key={temple.id}
                  href={APP_ROUTES.templeDetails(temple.id)}
                  className="block rounded-lg border border-black/10 bg-white p-4 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron"
                >
                  {translation?.name ?? temple.id}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {poojas.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-text-primary">
            Related Poojas
          </h2>
          <div className="mt-4 space-y-3">
            {poojas.map((pooja) => {
              const translation = getPrimaryPoojaTranslation(
                pooja.translations,
              );

              return (
                <Link
                  key={pooja.id}
                  href={APP_ROUTES.poojaDetails(pooja.id)}
                  className="block rounded-lg border border-black/10 bg-white p-4 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron"
                >
                  {translation?.name ?? pooja.id}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {relatedBlogs.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-text-primary">
            Related Blogs
          </h2>
          <div className="mt-4 space-y-3">
            {relatedBlogs.map((relatedBlog) => (
              <Link
                key={relatedBlog.id}
                href={APP_ROUTES.blogDetails(relatedBlog.slug)}
                className="block rounded-lg border border-black/10 bg-white p-4 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron"
              >
                {relatedBlog.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

export async function BlogDetailsView({
  blogIdOrSlug,
  isPreview = false,
  language,
}: BlogDetailsViewProps) {
  let blog: Blog | null = null;
  let error = "";

  try {
    blog = await getBlogDetailsApi(blogIdOrSlug);

    if (!blog.relatedBlogs || blog.relatedBlogs.length === 0) {
      const relatedResponse = await getAdminBlogsApi({
        limit: 3,
        status: "published",
        excludeId: blog.id,
      });
      blog = { ...blog, relatedBlogs: relatedResponse.items };
    }
  } catch (loadError: unknown) {
    error = getErrorMessage(loadError, "Unable to load blog.");
  }

  if (!blog) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-text-primary">
          Could not load blog
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Blog not found."}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.home}>Back home</Link>
        </Button>
      </section>
    );
  }

  const localizedBlog = getLocalizedBlog(blog, language);

  return (
    <main className={isPreview ? "bg-[#f6f7fb]" : "bg-white"}>
      {isPreview && (
        <div className="border-b border-black/10 bg-saffron/10 px-4 py-3 text-center text-sm font-extrabold text-saffron">
          Admin preview
        </div>
      )}

      <article className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Yaagam Blog
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-text-primary md:text-6xl">
            {localizedBlog.title}
          </h1>
          <p className="mt-5 text-lg font-semibold leading-8 text-text-primary/60 md:text-xl md:leading-9">
            {localizedBlog.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-text-primary/50">
            <span>{localizedBlog.author}</span>
            {formatDate(localizedBlog.publishedAt) && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(localizedBlog.publishedAt)}
              </span>
            )}
          </div>
        </header>

        {localizedBlog.featuredImageUrl && (
          <figure className="mt-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-black/5">
              <Image
                src={localizedBlog.featuredImageUrl}
                alt={localizedBlog.title}
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        <div className="mx-auto mt-10 max-w-3xl">
          <BlogBlockRenderer blocks={localizedBlog.blocks} />
          <div className="mt-12 border-t border-black/10 pt-6">
            <SocialShare blog={localizedBlog} />
          </div>
        </div>
      </article>

      <RelatedSection blog={localizedBlog} />
    </main>
  );
}