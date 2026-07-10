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
  imageKey: string;
  imageFile?: File;
  imageUrl?: string | null;
  previewUrl?: string;
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
  blocks?: BlogContentBlock[] | null;
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
  blocks: BlogContentBlock[];
};

export type BlogMutationInput = {
  title: string;
  excerpt: string;
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

export type ApiBlogTranslationInput = Omit<BlogTranslationInput, "blocks">;

export type ApiBlogMutationInput = {
  title: string;
  excerpt: string;
  author: string;
  status: ApiBlogStatus;
  publishedAt?: string;
  metaTitle: string;
  metaDescription: string;
  blocks: ApiBlogBlock[];
  translations?: ApiBlogTranslationInput[];
  relations?: {
    templeIds?: string[];
    poojaIds?: string[];
  };
};

export type BlogImageUploadResponse = {
  imageKey: string;
  imageUrl: string | null;
};

export type BlogTranslationSourceInput = {
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  blocks: BlogContentBlock[];
};

export type GeneratedBlogTranslations = Partial<
  Record<Exclude<BlogLanguage, "EN">, BlogTranslationSourceInput>
>;

type BlogTranslationRequestInput = Omit<BlogTranslationSourceInput, "blocks"> & {
  blocks: Array<Record<string, unknown>>;
};

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
  if (block.type === "image") {
    return {
      imageKey: block.imageKey,
      caption: block.caption,
      alt: block.alt,
    };
  }

  if (block.type === "gallery") {
    return {
      imageKeys: block.images.map((image) => image.imageKey).filter(Boolean),
      images: block.images.map((image) => ({
        imageKey: image.imageKey,
        caption: image.caption,
        alt: image.alt,
      })),
    };
  }

  const data = { ...block } as Record<string, unknown>;
  delete data.id;
  delete data.type;

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

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function fromApiBlock(block: unknown): BlogContentBlock | null {
  if (!block || typeof block !== "object") return null;

  const apiBlock = block as Partial<ApiBlogBlock>;
  const apiType = apiBlock.type;
  if (!apiType || !(apiType in blockTypeFromApi)) return null;

  const id = apiBlock.id ?? `${apiBlock.order ?? 0}-${apiType}`;
  const type = blockTypeFromApi[apiType];
  const data = (apiBlock.data ?? {}) as Record<string, unknown>;

  if (type === "image") {
    const imageKey = getString(data.imageKey || data.url);

    return {
      id,
      type,
      imageKey,
      imageUrl: getString(data.imageUrl || data.url || imageKey),
      caption: getString(data.caption),
      alt: getString(data.alt),
    };
  }

  if (type === "gallery") {
    const imageKeys = getStringArray(data.imageKeys);
    const imageUrls = getStringArray(data.imageUrls);
    const oldImages = Array.isArray(data.images)
      ? (data.images as Array<Record<string, unknown>>)
      : [];
    const images = (imageKeys.length ? imageKeys : oldImages.map((image) => getString(image.imageKey || image.url)))
      .filter(Boolean)
      .map((imageKey, index) => ({
        id: `${id}-${index}`,
        imageKey,
        imageUrl: imageUrls[index] || getString(oldImages[index]?.imageUrl || oldImages[index]?.url || imageKey),
        caption: getString(oldImages[index]?.caption),
        alt: getString(oldImages[index]?.alt),
      }));

    return { id, type, images };
  }

  return {
    id,
    type,
    ...data,
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
  if (!Array.isArray(value)) return [];

  return (value as BlogTranslation[]).map((translation) => ({
    ...translation,
    blocks: normalizeBlocks(translation.blocks),
  }));
}

function normalizeStatus(value: unknown): BlogStatus {
  return value === "PUBLISHED" || value === "published" ? "published" : "draft";
}

function toApiStatus(value: BlogStatus): ApiBlogStatus {
  return value === "published" ? "PUBLISHED" : "DRAFT";
}

function toApiTranslation(
  translation: BlogTranslationInput,
): ApiBlogTranslationInput {
  return {
    language: translation.language,
    title: translation.title,
    excerpt: translation.excerpt,
    metaTitle: translation.metaTitle || translation.title,
    metaDescription: translation.metaDescription || translation.excerpt,
  };
}

function createBlogPayload(input: BlogMutationInput): ApiBlogMutationInput {
  return {
    title: input.title,
    excerpt: input.excerpt,
    author: input.author,
    status: toApiStatus(input.status),
    publishedAt: input.publishedAt || undefined,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    blocks: input.blocks.map(toApiBlock),
    translations:
      input.translations.length > 0
        ? input.translations.map(toApiTranslation)
        : undefined,
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

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getTranslatedString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getTranslatableBlockData(block: BlogContentBlock) {
  if (block.type === "heading") return { text: block.text };
  if (block.type === "paragraph") return { text: block.text };
  if (block.type === "quote") {
    return { quote: block.quote, author: block.author ?? "" };
  }
  if (block.type === "ordered-list" || block.type === "unordered-list") {
    return { items: block.items };
  }
  if (block.type === "image") {
    return { caption: block.caption ?? "", alt: block.alt ?? "" };
  }
  if (block.type === "gallery") {
    return {
      images: block.images.map((image) => ({
        caption: image.caption ?? "",
        alt: image.alt ?? "",
      })),
    };
  }

  return {};
}

function createBlogTranslationRequest(
  input: BlogTranslationSourceInput,
): BlogTranslationRequestInput {
  return {
    title: input.title,
    excerpt: input.excerpt,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    blocks: input.blocks.map(getTranslatableBlockData),
  };
}

function mergeTranslatedBlock(
  sourceBlock: BlogContentBlock,
  translatedBlockValue: unknown,
): BlogContentBlock {
  const translatedBlock = getRecord(translatedBlockValue);

  if (sourceBlock.type === "heading") {
    return {
      ...sourceBlock,
      text: getTranslatedString(translatedBlock.text, sourceBlock.text),
    };
  }

  if (sourceBlock.type === "paragraph") {
    return {
      ...sourceBlock,
      text: getTranslatedString(translatedBlock.text, sourceBlock.text),
    };
  }

  if (sourceBlock.type === "quote") {
    return {
      ...sourceBlock,
      quote: getTranslatedString(translatedBlock.quote, sourceBlock.quote),
      author: getTranslatedString(translatedBlock.author, sourceBlock.author),
    };
  }

  if (sourceBlock.type === "ordered-list" || sourceBlock.type === "unordered-list") {
    const translatedItems = Array.isArray(translatedBlock.items)
      ? translatedBlock.items
      : [];

    return {
      ...sourceBlock,
      items: sourceBlock.items.map((item, index) =>
        getTranslatedString(translatedItems[index], item),
      ),
    };
  }

  if (sourceBlock.type === "image") {
    return {
      ...sourceBlock,
      caption: getTranslatedString(translatedBlock.caption, sourceBlock.caption),
      alt: getTranslatedString(translatedBlock.alt, sourceBlock.alt),
    };
  }

  if (sourceBlock.type === "gallery") {
    const translatedImages = Array.isArray(translatedBlock.images)
      ? translatedBlock.images
      : [];

    return {
      ...sourceBlock,
      images: sourceBlock.images.map((image, index) => {
        const translatedImage = getRecord(translatedImages[index]);

        return {
          ...image,
          caption: getTranslatedString(translatedImage.caption, image.caption),
          alt: getTranslatedString(translatedImage.alt, image.alt),
        };
      }),
    };
  }

  return sourceBlock;
}

function mergeTranslatedBlocks(
  sourceBlocks: BlogContentBlock[],
  translatedBlocksValue: unknown,
) {
  const translatedBlocks = Array.isArray(translatedBlocksValue)
    ? translatedBlocksValue
    : [];

  return sourceBlocks.map((block, index) =>
    mergeTranslatedBlock(block, translatedBlocks[index]),
  );
}

function normalizeGeneratedBlogTranslation(
  value: BlogTranslationSourceInput,
  sourceBlocks: BlogContentBlock[],
): BlogTranslationSourceInput {
  const translatedValue = value as BlogTranslationSourceInput & {
    blocks?: unknown;
  };

  return {
    title: value.title,
    excerpt: value.excerpt,
    metaTitle: value.metaTitle,
    metaDescription: value.metaDescription,
    blocks: mergeTranslatedBlocks(sourceBlocks, translatedValue.blocks),
  };
}

function normalizeGeneratedBlogTranslations(
  data: unknown,
  sourceBlocks: BlogContentBlock[],
): GeneratedBlogTranslations {
  if (!data || typeof data !== "object") return {};

  const result = data as Record<string, unknown>;
  const generated: GeneratedBlogTranslations = {};

  if (isBlogTranslationSource(result.malayalam)) {
    generated.ML = normalizeGeneratedBlogTranslation(result.malayalam, sourceBlocks);
  }
  if (isBlogTranslationSource(result.hindi)) {
    generated.HI = normalizeGeneratedBlogTranslation(result.hindi, sourceBlocks);
  }
  if (isBlogTranslationSource(result.marathi)) {
    generated.MR = normalizeGeneratedBlogTranslation(result.marathi, sourceBlocks);
  }
  if (isBlogTranslationSource(result.tamil)) {
    generated.TA = normalizeGeneratedBlogTranslation(result.tamil, sourceBlocks);
  }

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

async function getBlogDetailsByIdFallback(id: string) {
  const response = await instance.get("/blogs", {
    params: {
      limit: 1000,
    },
  });
  const blogsResponse = normalizeBlogsResponse(getResponseData(response.data));
  const matchingBlog = blogsResponse.items.find((blog) => blog.id === id);

  if (!matchingBlog?.slug) return null;

  const detailsResponse = await instance.get(`/blogs/${matchingBlog.slug}`);

  return normalizeBlog(getResponseData(detailsResponse.data) as Blog);
}

export async function getBlogDetailsApi(idOrSlug: string) {
  try {
    const response = await instance.get(`/blogs/${idOrSlug}`);

    return normalizeBlog(getResponseData(response.data) as Blog);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const fallbackBlog = await getBlogDetailsByIdFallback(idOrSlug);
        if (fallbackBlog) return fallbackBlog;
      } catch {
        // Preserve the original 404 error below.
      }
    }

    throwBlogApiError(error, "Unable to load blog.");
  }
}


export async function uploadBlogImageApi(file: File) {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await instance.post("/blogs/images", formData);

    return getResponseData(response.data) as BlogImageUploadResponse;
  } catch (error: unknown) {
    throwBlogApiError(error, "Unable to upload blog image.");
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
    const translationRequest = createBlogTranslationRequest(englishTranslation);
    const response = await instance.post("/translations", {
      data: translationRequest,
      sourceLanguage: "en",
    });

    return normalizeGeneratedBlogTranslations(
      getResponseData(response.data),
      englishTranslation.blocks,
    );
  } catch (error: unknown) {
    throwBlogApiError(error, "Blog translation failed. Please try again.");
  }
}