import type { Prisma } from '@prisma/client';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateTempleDto } from '../dtos/create-temple.dto';
import type { UpdateTempleDto } from '../dtos/update-temple.dto';

export type TempleWithTranslations = Prisma.TempleGetPayload<{
  select: {
    id: true;
    slug: true;
    isActive: true;
    imageKey: true;
    state: true;
    description: true;
    templePriest: true;
    createdAt: true;
    updatedAt: true;
    translations: true;
  };
}>;

export type TempleDetails = Prisma.TempleGetPayload<{
  select: {
    id: true;
    slug: true;
    isActive: true;
    imageKey: true;
    state: true;
    description: true;
    templePriest: true;
    createdAt: true;
    updatedAt: true;
    translations: true;
    _count: { select: { poojas: true; bookings: true } };
  };
}>;

export type OpsTempleWithTranslations = Prisma.TempleGetPayload<{
  select: {
    id: true;
    slug: true;
    isActive: true;
    email: true;
    imageKey: true;
    zohoVendorId: true;
    zohoSyncStatus: true;
    zohoSyncError: true;
    lastZohoSyncAt: true;
    state: true;
    description: true;
    templePriest: true;
    createdAt: true;
    updatedAt: true;
    translations: true;
  };
}>;

export type OpsTempleDetails = Prisma.TempleGetPayload<{
  select: {
    id: true;
    slug: true;
    isActive: true;
    email: true;
    imageKey: true;
    zohoVendorId: true;
    zohoSyncStatus: true;
    zohoSyncError: true;
    lastZohoSyncAt: true;
    state: true;
    description: true;
    templePriest: true;
    createdAt: true;
    updatedAt: true;
    translations: true;
    _count: { select: { poojas: true; bookings: true } };
  };
}>;

export type TempleResponse = Omit<TempleWithTranslations, 'imageKey'> & {
  imageUrl: string | null;
};

export type TempleDetailsResponse = Omit<TempleDetails, 'imageKey'> & {
  heroImageUrl: string | null;
};

export type OpsTempleResponse = Omit<OpsTempleWithTranslations, 'imageKey'> & {
  imageUrl: string | null;
};

export type OpsTempleDetailsResponse = Omit<OpsTempleDetails, 'imageKey'> & {
  imageUrl: string | null;
};

export interface GetTemplesInput {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedTemples {
  items: TempleResponse[];
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
  getOpsTemples(input: GetTemplesInput): Promise<PaginatedTemples>;
  getTempleDetailsBySlug(slug: string): Promise<TempleDetailsResponse>;
  getTempleDetails(id: string): Promise<OpsTempleDetailsResponse>;
  createTemple(
    input: CreateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<OpsTempleResponse>;
  updateTemple(
    id: string,
    input: UpdateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<OpsTempleResponse>;
  deleteTemple(id: string): Promise<OpsTempleResponse>;
  syncTempleWithZoho(id: string): Promise<OpsTempleResponse>;
}
