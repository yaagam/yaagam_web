import type {
  BlogBlockType,
  BlogStatus,
  Language,
  Prisma,
} from '@prisma/client';

export interface BlogTranslationEntity {
  id: string;
  blogId: string;
  language: Language;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
}

export interface BlogBlockEntity {
  id: string;
  order: number;
  type: BlogBlockType;
  data: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogRelatedTempleEntity {
  id: string;
  imageKey: string | null;
  state: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  translations?: Array<{
    id: string;
    templeId: string;
    language: string;
    name: string;
    district: string;
    place: string;
    description: string;
  }>;
}

export interface BlogRelatedPoojaEntity {
  id: string;
  templeId: string;
  baseAmount: Prisma.Decimal;
  poojaDay: string;
  isWeekly: boolean;
  weeklyDiscount: number | null;
  normalDiscount: number | null;
  createdAt: Date;
  updatedAt: Date;
  imageKeys: string[];
  time: string;
  translations?: Array<{
    id: string;
    poojaId: string;
    language: string;
    name: string;
    about: string;
  }>;
}

export interface BlogEntity {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageKey: string | null;
  author: string;
  status: BlogStatus;
  metaTitle: string;
  metaDescription: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  blocks: BlogBlockEntity[];
  translations: BlogTranslationEntity[];
  relatedTemples: BlogRelatedTempleEntity[];
  relatedPoojas: BlogRelatedPoojaEntity[];
}
