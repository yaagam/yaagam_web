import type {
  BlogBlockType,
  BlogStatus,
  Language,
  Prisma,
} from '@prisma/client';
import type { GetBlogsQueryDto } from '../dtos/get-blogs-query.dto';
import type { BlogEntity } from '../entities/blog.entity';

export interface BlogRepositoryBlockInput {
  id?: string;
  order: number;
  type: BlogBlockType;
  data: Prisma.InputJsonValue;
}

export interface BlogRepositoryTranslationInput {
  language: Language;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
}

export interface BlogRepositoryRelationsInput {
  templeIds?: string[];
  poojaIds?: string[];
}

export interface BlogRepositoryCreateInput {
  title: string;
  slug: string;
  excerpt: string;
  featuredImageKey?: string | null;
  author: string;
  status: BlogStatus;
  metaTitle: string;
  metaDescription: string;
  publishedAt?: Date | null;
  relations?: BlogRepositoryRelationsInput;
  blocks: BlogRepositoryBlockInput[];
  translations?: BlogRepositoryTranslationInput[];
}

export interface BlogRepositoryUpdateInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImageKey?: string | null;
  author?: string;
  status?: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date | null;
  relations?: BlogRepositoryRelationsInput;
  blocks?: BlogRepositoryBlockInput[];
  translations?: BlogRepositoryTranslationInput[];
}

export interface PaginatedBlogs {
  items: BlogEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IBlogRepository {
  create(input: BlogRepositoryCreateInput): Promise<BlogEntity>;
  update(id: string, input: BlogRepositoryUpdateInput): Promise<BlogEntity>;
  softDelete(id: string): Promise<BlogEntity>;
  findById(id: string): Promise<BlogEntity | null>;
  findBySlug(slug: string): Promise<BlogEntity | null>;
  findMany(query: GetBlogsQueryDto): Promise<PaginatedBlogs>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  countExistingTemples(ids: string[]): Promise<number>;
  countExistingPoojas(ids: string[]): Promise<number>;
  findBlockIds(blogId: string): Promise<string[]>;
}
