"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Languages,
  Loader2,
  Save,
  Search,
} from "lucide-react";

import { BlogBlockEditor } from "@/components/admin/blog/BlogBlockEditor";
import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/ToastProvider";
import { ADMIN_LANGUAGE_LABELS } from "@/constants/admin-form.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  blogLanguages,
  createBlogApi,
  generateBlogTranslationsApi,
  updateBlogApi,
  type Blog,
  type BlogContentBlock,
  type BlogLanguage,
  type BlogMutationInput,
  type BlogStatus,
  type BlogTranslationInput,
  type BlogTranslationSourceInput,
} from "@/lib/api/admin/blog/blogs.api";
import {
  getAdminPoojasApi,
  type Pooja,
  type PoojaTranslation,
} from "@/lib/api/admin/pooja/poojas.api";
import {
  getAdminTemplesApi,
  type Temple,
  type TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

type BlogFormMode = "create" | "update";

type BlogFormProps = {
  blog?: Blog;
  mode: BlogFormMode;
};

type SelectOption = {
  id: string;
  label: string;
};

type BlogTranslationFormState = Record<
  BlogLanguage,
  {
    title: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    blocks: BlogContentBlock[];
  }
>;

const statusOptions: Array<{ value: BlogStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function normalizePublishDate(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function createEmptyTranslations(): BlogTranslationFormState {
  return blogLanguages.reduce((acc, language) => {
    acc[language] = {
      title: "",
      excerpt: "",
      metaTitle: "",
      metaDescription: "",
      blocks: [],
    };

    return acc;
  }, {} as BlogTranslationFormState);
}

function createTranslationState(blog?: Blog) {
  const nextTranslations = createEmptyTranslations();
  const englishFallback = {
    title: blog?.title ?? "",
    excerpt: blog?.excerpt ?? "",
    metaTitle: blog?.metaTitle ?? "",
    metaDescription: blog?.metaDescription ?? "",
    blocks: blog?.blocks ?? [],
  };

  nextTranslations.EN = englishFallback;

  for (const translation of blog?.translations ?? []) {
    if (!blogLanguages.includes(translation.language)) continue;

    nextTranslations[translation.language] = {
      title: translation.title ?? "",
      excerpt: translation.excerpt ?? "",
      metaTitle: translation.metaTitle ?? "",
      metaDescription: translation.metaDescription ?? "",
      blocks: translation.language === "EN" ? blog?.blocks ?? [] : [],
    };
  }

  return nextTranslations;
}

function getTranslationPayload(
  translations: BlogTranslationFormState,
): BlogTranslationInput[] {
  return blogLanguages
    .map((language) => ({
      language,
      title: translations[language].title.trim(),
      excerpt: translations[language].excerpt.trim(),
      metaTitle: translations[language].metaTitle.trim(),
      metaDescription: translations[language].metaDescription.trim(),
    }))
    .filter(
      (translation) =>
        translation.title ||
        translation.excerpt ||
        translation.metaTitle ||
        translation.metaDescription
    );
}

function validateTranslations(translations: BlogTranslationInput[]) {
  if (translations.length === 0) return "Add at least one blog translation.";

  const incompleteTranslation = translations.find(
    (translation) =>
      !translation.title || !translation.excerpt,
  );

  if (incompleteTranslation) {
    return `Complete title and excerpt for ${ADMIN_LANGUAGE_LABELS[incompleteTranslation.language]}.`;
  }

  return "";
}

function getOriginalEnglishTranslation(
  blog?: Blog,
): BlogTranslationSourceInput | null {
  if (!blog) return null;

  const englishTranslation = blog.translations?.find(
    (translation) => translation.language === "EN",
  );

  return {
    title: (englishTranslation?.title ?? blog.title ?? "").trim(),
    excerpt: (englishTranslation?.excerpt ?? blog.excerpt ?? "").trim(),
    metaTitle: (englishTranslation?.metaTitle ?? blog.metaTitle ?? "").trim(),
    metaDescription: (
      englishTranslation?.metaDescription ??
      blog.metaDescription ??
      ""
    ).trim(),
  };
}

function isSameTranslationSource(
  first: BlogTranslationSourceInput,
  second: BlogTranslationSourceInput,
) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
}: {
  label: string;
  onChange: (ids: string[]) => void;
  options: SelectOption[];
  placeholder: string;
  selectedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const selectedOptions = options.filter((option) =>
    selectedIds.includes(option.id),
  );
  const visibleOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function toggleOption(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-extrabold text-text-primary">{label}</h3>
      <label className="relative mt-4 block">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/35" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
        />
      </label>

      {selectedOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className="rounded-full bg-saffron/10 px-3 py-1 text-xs font-extrabold text-saffron"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
        {visibleOptions.length === 0 ? (
          <p className="text-sm font-semibold leading-6 text-text-primary/55">
            No options found
          </p>
        ) : (
          visibleOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-3 rounded-lg border border-black/10 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => toggleOption(option.id)}
                className="mt-1 h-4 w-4 accent-saffron"
              />
              <span className="min-w-0 text-sm font-bold leading-6 text-text-primary">
                {option.label}
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}

export function BlogForm({ blog, mode }: BlogFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [translations, setTranslations] = useState(() =>
    createTranslationState(blog),
  );
  const [slug, setSlug] = useState(blog?.slug ?? "");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(blog?.slug));
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    blog?.featuredImageUrl ?? "",
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    "",
  );
  const [author, setAuthor] = useState(blog?.author ?? "Yaagam Editorial");
  const [status, setStatus] = useState<BlogStatus>(blog?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    toDateTimeLocal(blog?.publishedAt),
  );
  const [templeIds, setTempleIds] = useState(blog?.templeIds ?? []);
  const [poojaIds, setPoojaIds] = useState(blog?.poojaIds ?? []);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTranslations, setIsGeneratingTranslations] =
    useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const pageTitle = mode === "create" ? "Create Blog" : "Edit Blog";
  const englishTranslation = {
    title: translations.EN.title.trim(),
    excerpt: translations.EN.excerpt.trim(),
    metaTitle: translations.EN.metaTitle.trim(),
    metaDescription: translations.EN.metaDescription.trim(),
  };
  const originalEnglishTranslation = getOriginalEnglishTranslation(blog);
  const isEnglishUnchanged =
    mode === "update" &&
    originalEnglishTranslation !== null &&
    isSameTranslationSource(englishTranslation, originalEnglishTranslation);

  const templeOptions = useMemo<SelectOption[]>(
    () =>
      temples.map((temple) => ({
        id: temple.id,
        label:
          getPrimaryTempleTranslation(temple.translations)?.name ?? temple.id,
      })),
    [temples],
  );
  const poojaOptions = useMemo<SelectOption[]>(
    () =>
      poojas.map((pooja) => ({
        id: pooja.id,
        label: getPrimaryPoojaTranslation(pooja.translations)?.name ?? pooja.id,
      })),
    [poojas],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        translations,
        slug,
        featuredImageUrl,
        featuredImageAlt,
        author,
        status,
        publishedAt,
        templeIds,
        poojaIds,
      }),
    [
      author,
      featuredImageAlt,
      featuredImageUrl,
      poojaIds,
      publishedAt,
      slug,
      status,
      templeIds,
      translations,
    ],
  );
  const [savedSnapshot, setSavedSnapshot] = useState(formSnapshot);
  const isDirty = formSnapshot !== savedSnapshot;

  useEffect(() => {
    let isActive = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [templeResponse, poojaResponse] = await Promise.all([
          getAdminTemplesApi({ limit: 100 }),
          getAdminPoojasApi({ limit: 100 }),
        ]);

        if (!isActive) return;
        setTemples(templeResponse.items);
        setPoojas(poojaResponse.items);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load blog options."));
        }
      } finally {
        if (isActive) setIsLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  function updateTranslation(
    language: BlogLanguage,
    field: Exclude<keyof BlogTranslationFormState[BlogLanguage], "blocks">,
    value: string,
  ) {
    setTranslations((current) => ({
      ...current,
      [language]: {
        ...current[language],
        [field]: value,
      },
    }));
    setError("");
  }

  function updateTranslationBlocks(
    language: BlogLanguage,
    blocks: BlogContentBlock[],
  ) {
    setTranslations((current) => ({
      ...current,
      [language]: {
        ...current[language],
        blocks,
      },
    }));
    setError("");
  }

  function buildInput(): BlogMutationInput {
    const translationPayload = getTranslationPayload(translations);

    return {
      title: translations.EN.title.trim(),
      slug: slugify(slug),
      excerpt: translations.EN.excerpt.trim(),
      featuredImageKey: featuredImageUrl.trim(),
      author: author.trim(),
      status,
      publishedAt: normalizePublishDate(publishedAt),
      metaTitle: translations.EN.metaTitle.trim(),
      metaDescription: translations.EN.metaDescription.trim(),
      blocks: translations.EN.blocks,
      translations: translationPayload,
      templeIds,
      poojaIds,
    };
  }

  function validateInput(input: BlogMutationInput) {
    const translationError = validateTranslations(input.translations);

    if (!input.title) return "Enter the English blog title.";
    if (!input.slug) return "Enter the blog slug.";
    if (!input.excerpt) return "Enter the English blog excerpt.";
    if (input.blocks.length === 0) return "Add at least one English content block.";
    if (!input.author) return "Enter the author name.";
    if (input.status === "published" && !input.publishedAt) {
      return "Select a publish date for published blogs.";
    }
    if (translationError) return translationError;

    return "";
  }

  async function handleGenerateTranslations() {
    const validationError = validateTranslations([
      {
        language: "EN",
        ...englishTranslation,
      },
    ]);

    if (validationError) {
      setError(
        "Complete English title and excerpt before generating translations.",
      );
      return;
    }

    if (isEnglishUnchanged) {
      setError("");
      showToast(
        "success",
        "English details unchanged; translations not regenerated.",
      );
      return;
    }

    setIsGeneratingTranslations(true);
    setError("");

    try {
      const generatedTranslations =
        await generateBlogTranslationsApi(englishTranslation);

      setTranslations((current) => {
        const nextTranslations = { ...current };

        for (const language of blogLanguages) {
          if (language === "EN") continue;

          const generatedTranslation = generatedTranslations[language];
          if (!generatedTranslation) continue;

          nextTranslations[language] = {
            title: generatedTranslation.title,
            excerpt: generatedTranslation.excerpt,
            metaTitle: generatedTranslation.metaTitle ?? "",
            metaDescription: generatedTranslation.metaDescription ?? "",
            blocks: current[language].blocks,
          };
        }

        return nextTranslations;
      });
      showToast("success", "Translations generated successfully.");
    } catch (generateError: unknown) {
      setError(
        getErrorMessage(generateError, "Unable to generate blog translations."),
      );
    } finally {
      setIsGeneratingTranslations(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = buildInput();
    const inputError = validateInput(input);

    if (inputError) {
      setError(inputError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const savedBlog =
        mode === "create"
          ? await createBlogApi(input)
          : await updateBlogApi(blog?.id ?? "", input);

      showToast(
        "success",
        mode === "create"
          ? "Blog created successfully."
          : "Blog updated successfully.",
      );
      setSavedSnapshot(formSnapshot);
      router.push(APP_ROUTES.adminBlogDetails(savedBlog.id));
      router.refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save blog."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Blog Management
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            {pageTitle}
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={isGeneratingTranslations || isEnglishUnchanged}
            onClick={handleGenerateTranslations}
            className="min-h-11 rounded-lg"
          >
            {isGeneratingTranslations ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            Generate translations
          </Button>
          {blog && (
            <Button asChild variant="outline" className="min-h-11 rounded-lg">
              <Link href={APP_ROUTES.adminBlogPreview(blog.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview page
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview((current) => !current)}
            className="min-h-11 rounded-lg"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <Link href={APP_ROUTES.adminBlogs}>
              <ArrowLeft className="motion-arrow-left mr-2 h-4 w-4" />
              Back to blogs
            </Link>
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <div className="space-y-5">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Publishing Details
            </h3>
            <div className="mt-4 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-bold text-text-primary/70">
                  Slug
                </span>
                <Input
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setIsSlugManual(true);
                    setError("");
                  }}
                  placeholder="blog-slug"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Author
                  </span>
                  <Input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Author name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as BlogStatus)
                    }
                    className="h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-semibold text-text-primary outline-none focus:border-saffron"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Publish Date
                  </span>
                  <Input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-black/10 bg-[#f8fafc]">
                  <div className="relative aspect-video">
                    {featuredImageUrl ? (
                      <Image
                        src={featuredImageUrl}
                        alt={
                          featuredImageAlt ||
                          translations.EN.title ||
                          "Featured image"
                        }
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-primary/35">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Input
                    value={featuredImageUrl}
                    onChange={(event) =>
                      setFeaturedImageUrl(event.target.value)
                    }
                    placeholder="Featured image URL"
                  />
                  <Input
                    value={featuredImageAlt}
                    onChange={(event) =>
                      setFeaturedImageAlt(event.target.value)
                    }
                    placeholder="Featured image alt text"
                  />
                </div>
              </div>
            </div>
          </section>

          {blogLanguages.map((language) => (
            <section
              key={language}
              className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-extrabold text-text-primary">
                {ADMIN_LANGUAGE_LABELS[language]}
              </h3>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Title
                  </span>
                  <Input
                    value={translations[language].title}
                    onChange={(event) => {
                      const nextTitle = event.target.value;
                      updateTranslation(language, "title", nextTitle);
                      if (language === "EN" && !isSlugManual) {
                        setSlug(slugify(nextTitle));
                      }
                    }}
                    placeholder="Blog title"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Excerpt
                  </span>
                  <textarea
                    value={translations[language].excerpt}
                    onChange={(event) =>
                      updateTranslation(language, "excerpt", event.target.value)
                    }
                    rows={3}
                    placeholder="Short summary for cards and SEO"
                    className="w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-semibold leading-7 text-text-primary shadow-sm outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-text-primary/70">
                      Meta Title
                    </span>
                    <Input
                      value={translations[language].metaTitle}
                      onChange={(event) =>
                        updateTranslation(
                          language,
                          "metaTitle",
                          event.target.value,
                        )
                      }
                      placeholder="SEO title"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-text-primary/70">
                      Meta Description
                    </span>
                    <Input
                      value={translations[language].metaDescription}
                      onChange={(event) =>
                        updateTranslation(
                          language,
                          "metaDescription",
                          event.target.value,
                        )
                      }
                      placeholder="SEO description"
                    />
                  </label>
                </div>
                <BlogBlockEditor
                  blocks={translations[language].blocks}
                  onChange={(blocks) => updateTranslationBlocks(language, blocks)}
                />
              </div>
            </section>
          ))}

          {showPreview && (
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
                English Preview
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight text-text-primary">
                {translations.EN.title || "Untitled blog"}
              </h1>
              {translations.EN.excerpt && (
                <p className="mt-4 text-xl font-semibold leading-9 text-text-primary/60">
                  {translations.EN.excerpt}
                </p>
              )}
              <BlogBlockRenderer blocks={translations.EN.blocks} />
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <MultiSelect
            label="Related Temples"
            options={templeOptions}
            selectedIds={templeIds}
            onChange={setTempleIds}
            placeholder={isLoadingOptions ? "Loading temples" : "Search temples"}
          />
          <MultiSelect
            label="Related Poojas"
            options={poojaOptions}
            selectedIds={poojaIds}
            onChange={setPoojaIds}
            placeholder={isLoadingOptions ? "Loading poojas" : "Search poojas"}
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
              {error}
            </p>
          )}

          {isDirty && (
            <p className="rounded-lg border border-saffron/25 bg-saffron/10 p-3 text-sm font-bold leading-6 text-[#7a3f12]">
              You have unsaved changes.
            </p>
          )}

          <Button
            type="submit"
            disabled={isSaving}
            className="min-h-12 w-full rounded-lg text-base font-extrabold"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving" : pageTitle}
          </Button>
        </aside>
      </form>
    </section>
  );
}
