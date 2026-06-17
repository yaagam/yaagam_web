import type { Prisma } from '@prisma/client';

export type TempleWithTranslations = Prisma.TempleGetPayload<{
  include: { translations: true };
}>;

export interface GetTemplesInput {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedTemples {
  items: TempleWithTranslations[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ITempleService {
  getTemples(input: GetTemplesInput): Promise<PaginatedTemples>;
}
