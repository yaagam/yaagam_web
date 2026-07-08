import axios from "axios";

import instance from "@/lib/api/axios/axios.instance";
import type { Pooja } from "@/lib/api/admin/pooja/poojas.api";
import type { Temple } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

export const blogStatuses = ["draft", "published"] as const;
export const blogLanguages = ["EN", "ML", "HI", "MR", "TA"] as const;

export type BlogStatus = (typeof blogStatuses)[number];
export type ApiBlogStatus = "DRAFT" | "PUBLISHED";
export type BlogLanguage = (typeof blogLanguages)[number];
export type BlogSortKey = "createdAt" | "publishedAt" | "title" | "status";
export type BlogSortOrder = "asc" | "desc";
export type BlogBlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "gallery"
  | "quote"
  | "ordered-list"
  | "unordered-list"
  | "divider"
  | "youtube";

export type ApiBlogBlockType =
  | "HEADING"
  | "PARAGRAPH"
  | "IMAGE"
  | "GALLERY"
  | "QUOTE"
  | "ORDERED_LIST"
  | "UNORDERED_LIST"
  | "DIVIDER"
  | "YOUTUBE";

export type BlogImageValue = {
  url: string;
  caption?: string;
  alt?: string;
};

export type BlogGalleryImage = BlogImageValue & {
  id: string;
};

export type BlogBlockBase<TType extends BlogBlockType> = {
  id: string;
  type: TType;
};

export type BlogHeadingBlock = BlogBlockBase<"heading"> & {
  text: string;
  level: 2 | 3 | 4;
};

export type BlogParagraphBlock = BlogBlockBase<"paragraph"> & {
  text: string;
};

export type BlogImageBlock = BlogBlockBase<"image"> & BlogImageValue;

export type BlogGalleryBlock = BlogBlockBase<"gallery"> & {
  images: BlogGalleryImage[];
};

export type BlogQuoteBlock = BlogBlockBase<"quote"> & {
  quote: string;
  author?: string;
};

export type BlogListBlock = BlogBlockBase<"ordered-list" | "unordered-list"> & {
  items: string[];
};

export type BlogDividerBlock = BlogBlockBase<"divider">;

export type BlogYoutubeBlock = BlogBlockBase<"youtube"> & {
  url: string;
};

export type BlogContentBlock =
  | BlogHeadingBlock
  | BlogParagraphBlock
  | BlogImageBlock
  | BlogGalleryBlock
  | BlogQuoteBlock
  | BlogListBlock
  | BlogDividerBlock
  | BlogYoutubeBlock;

export type ApiBlogBlock = {
  id?: string;
  order: number;
  type: ApiBlogBlockType;
  data: Record<string, unknown>;
};

export type BlogTranslation = {
  id?: string;
  blogId?: string;
  language: BlogLanguage;
  title: string;
  excerpt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageKey?: string | null;
  featuredImageUrl?: string | null;
  author: string;
  status: BlogStatus;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  blocks: BlogContentBlock[];
  translations?: BlogTranslation[];
  templeIds: string[];
  poojaIds: string[];
  temples?: Temple[];
  poojas?: Pooja[];
  relatedBlogs?: Blog[];
  relatedTemples?: Temple[];
  relatedPoojas?: Pooja[];
  createdAt: string;
  updatedAt: string;
};

export type BlogTranslationInput = {
  language: BlogLanguage;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
};

export type BlogMutationInput = {
  title: string;
  slug: string;
  excerpt: string;
  featuredImageKey?: string;
  author: string;
  status: BlogStatus;
  publishedAt?: string;
  metaTitle: string;
  metaDescription: string;
  blocks: BlogContentBlock[];
  translations: BlogTranslationInput[];
  templeIds: string[];
  poojaIds: string[];
};

export type ApiBlogMutationInput = {
  title: string;
  slug?: string;
  excerpt: string;
  featuredImageKey?: string;
  author: string;
  status: ApiBlogStatus;
  publishedAt?: string;
  metaTitle: string;
  metaDescription: string;
  blocks: ApiBlogBlock[];
  translations?: BlogTranslationInput[];
  relations?: {
    templeIds?: string[];
    poojaIds?: string[];
  };
};

export type BlogTranslationSourceInput = {
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
};

export type GeneratedBlogTranslations = Partial<
  Record<Exclude<BlogLanguage, "EN">, BlogTranslationSourceInput>
>;

export type BlogsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type BlogsResponse = {
  items: Blog[];
  meta: BlogsMeta;
};

export type GetBlogsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus | "";
  sortBy?: BlogSortKey;
  sortOrder?: BlogSortOrder;
  excludeId?: string;
};

export class BlogApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
  }
}

const emptyMeta: BlogsMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const blockTypeToApi: Record<BlogBlockType, ApiBlogBlockType> = {
  heading: "HEADING",
  paragraph: "PARAGRAPH",
  image: "IMAGE",
  gallery: "GALLERY",
  quote: "QUOTE",
  "ordered-list": "ORDERED_LIST",
  "unordered-list": "UNORDERED_LIST",
  divider: "DIVIDER",
  youtube: "YOUTUBE",
};

const blockTypeFromApi: Record<ApiBlogBlockType, BlogBlockType> = {
  HEADING: "heading",
  PARAGRAPH: "paragraph",
  IMAGE: "image",
  GALLERY: "gallery",
  QUOTE: "quote",
  ORDERED_LIST: "ordered-list",
  UNORDERED_LIST: "unordered-list",
  DIVIDER: "divider",
  YOUTUBE: "youtube",
};

function getResponseData(responseData: unknown) {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as { data?: unknown }).data;
  }

  return responseData;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getBlockData(block: BlogContentBlock): Record<string, unknown> {
  const { id: _id, type: _type, ...data } = block;
  return data;
}

function toApiBlock(block: BlogContentBlock, index: number): ApiBlogBlock {
  return {
    id: block.id || undefined,
    order: index + 1,
    type: blockTypeToApi[block.type],
    data: getBlockData(block),
  };
}

function fromApiBlock(block: unknown): BlogContentBlock | null {
  if (!block || typeof block !== "object") return null;

  const apiBlock = block as Partial<ApiBlogBlock>;
  const apiType = apiBlock.type;
  if (!apiType || !(apiType in blockTypeFromApi)) return null;

  return {
    id: apiBlock.id ?? `${apiBlock.order ?? 0}-${apiType}`,
    type: blockTypeFromApi[apiType],
    ...(apiBlock.data ?? {}),
  } as BlogContentBlock;
}

function normalizeBlocks(value: unknown): BlogContentBlock[] {
  if (!Array.isArray(value)) return [];

  const maybeApiBlocks = value
    .map(fromApiBlock)
    .filter((block): block is BlogContentBlock => Boolean(block));

  return maybeApiBlocks.length > 0 ? maybeApiBlocks : (value as BlogContentBlock[]);
}

function normalizeTranslations(value: unknown): BlogTranslation[] {
  return Array.isArray(value) ? (value as BlogTranslation[]) : [];
}

function normalizeStatus(value: unknown): BlogStatus {
  return value === "PUBLISHED" || value === "published" ? "published" : "draft";
}

function toApiStatus(value: BlogStatus): ApiBlogStatus {
  return value === "published" ? "PUBLISHED" : "DRAFT";
}

function createBlogPayload(input: BlogMutationInput): ApiBlogMutationInput {
  return {
    title: input.title,
    slug: input.slug || undefined,
    excerpt: input.excerpt,
    featuredImageKey: input.featuredImageKey || undefined,
    author: input.author,
    status: toApiStatus(input.status),
    publishedAt: input.publishedAt || undefined,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    blocks: input.blocks.map(toApiBlock),
    translations: input.translations.length > 0 ? input.translations : undefined,
    relations:
      input.templeIds.length > 0 || input.poojaIds.length > 0
        ? {
            templeIds: input.templeIds,
            poojaIds: input.poojaIds,
          }
        : undefined,
  };
}

export function normalizeBlog(blog: Blog): Blog {
  const translations = normalizeTranslations(blog.translations);
  const primaryTranslation =
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null;
  const relatedTemples = blog.relatedTemples ?? blog.temples ?? [];
  const relatedPoojas = blog.relatedPoojas ?? blog.poojas ?? [];

  return {
    ...blog,
    title: blog.title ?? primaryTranslation?.title ?? "",
    excerpt: blog.excerpt ?? primaryTranslation?.excerpt ?? "",
    featuredImageKey: blog.featuredImageKey ?? null,
    featuredImageUrl: blog.featuredImageUrl ?? blog.featuredImageKey ?? null,
    publishedAt: blog.publishedAt ?? null,
    status: normalizeStatus(blog.status),
    metaTitle: blog.metaTitle ?? primaryTranslation?.metaTitle ?? "",
    metaDescription: blog.metaDescription ?? primaryTranslation?.metaDescription ?? "",
    blocks: normalizeBlocks(blog.blocks),
    translations,
    temples: relatedTemples,
    poojas: relatedPoojas,
    relatedTemples,
    relatedPoojas,
    templeIds: normalizeStringArray(blog.templeIds).length
      ? normalizeStringArray(blog.templeIds)
      : normalizeStringArray(relatedTemples.map((temple) => temple.id)),
    poojaIds: normalizeStringArray(blog.poojaIds).length
      ? normalizeStringArray(blog.poojaIds)
      : normalizeStringArray(relatedPoojas.map((pooja) => pooja.id)),
  };
}

function normalizeBlogsResponse(data: unknown): BlogsResponse {
  if (Array.isArray(data)) {
    return {
      items: (data as Blog[]).map(normalizeBlog),
      meta: {
        ...emptyMeta,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (data && typeof data === "object") {
    const response = data as Partial<BlogsResponse>;

    return {
      items: Array.isArray(response.items)
        ? response.items.map(normalizeBlog)
        : [],
      meta: {
        ...emptyMeta,
        ...(response.meta ?? {}),
      },
    };
  }

  return {
    items: [],
    meta: emptyMeta,
  };
}

function throwBlogApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    throw new BlogApiError(
      getErrorMessage(
        error.response?.data?.message ?? error.response?.data,
        fallback,
      ),
      error.response?.status,
    );
  }

  throw new BlogApiError(getErrorMessage(error, fallback));
}

function isBlogTranslationSource(
  value: unknown,
): value is BlogTranslationSourceInput {
  if (!value || typeof value !== "object") return false;

  const translation = value as Partial<BlogTranslationSourceInput>;

  return (
    typeof translation.title === "string" &&
    typeof translation.excerpt === "string" &&
    typeof translation.metaTitle === "string" &&
    typeof translation.metaDescription === "string"
  );
}

function normalizeGeneratedBlogTranslations(
  data: unknown,
): GeneratedBlogTranslations {
  if (!data || typeof data !== "object") return {};

  const result = data as Record<string, unknown>;
  const generated: GeneratedBlogTranslations = {};

  if (isBlogTranslationSource(result.malayalam)) generated.ML = result.malayalam;
  if (isBlogTranslationSource(result.hindi)) generated.HI = result.hindi;
  if (isBlogTranslationSource(result.marathi)) generated.MR = result.marathi;
  if (isBlogTranslationSource(result.tamil)) generated.TA = result.tamil;

  return generated;
}

export async function getAdminBlogsApi(params: GetBlogsParams = {}) {
  try {
    const response = await instance.get("/blogs", {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        status: params.status ? toApiStatus(params.status) : undefined,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        excludeId: params.excludeId,
      },
    });

    return normalizeBlogsResponse(getResponseData(response.data));
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to load blogs.");
  }
}

export async function getBlogDetailsApi(idOrSlug: string) {
  try {
    const response = await instance.get(`/blogs/${idOrSlug}`);

    return normalizeBlog(getResponseData(response.data) as Blog);
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to load blog.");
  }
}

export async function createBlogApi(input: BlogMutationInput) {
  try {
    const response = await instance.post("/blogs", createBlogPayload(input));

    return normalizeBlog(getResponseData(response.data) as Blog);
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to create blog.");
  }
}

export async function updateBlogApi(id: string, input: BlogMutationInput) {
  try {
    const response = await instance.patch(`/blogs/${id}`, createBlogPayload(input));

    return normalizeBlog(getResponseData(response.data) as Blog);
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to update blog.");
  }
}

export async function deleteBlogApi(id: string) {
  try {
    const response = await instance.delete(`/blogs/${id}`);

    return normalizeBlog(getResponseData(response.data) as Blog);
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to delete blog.");
  }
}

export async function generateBlogTranslationsApi(
  englishTranslation: BlogTranslationSourceInput,
) {
  try {
    const response = await instance.post("/translations", {
      data: englishTranslation,
      sourceLanguage: "en",
    });

    return normalizeGeneratedBlogTranslations(getResponseData(response.data));
  } catch (error: unknown) {
    throwBlogApiError(error, "Blog translation failed. Please try again.");
  }
}