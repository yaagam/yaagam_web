import type { Prisma } from '@prisma/client';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateTempleDto } from '../dtos/create-temple.dto';
import type { UpdateTempleDto } from '../dtos/update-temple.dto';

type TempleWithTranslationsPayload = Prisma.TempleGetPayload<{
  include: { translations: true };
}>;

export type TempleWithTranslations = Omit<
  TempleWithTranslationsPayload,
  'email'
>;

type TempleDetailsPayload = Prisma.TempleGetPayload<{
  include: {
    translations: true;
    _count: { select: { poojas: true; bookings: true } };
  };
}>;

export type TempleDetails = Omit<TempleDetailsPayload, 'email'>;

export type TempleResponse = TempleWithTranslations & {
  imageUrl: string | null;
};

export type TempleDetailsResponse = TempleDetails & {
  imageUrl: string | null;
};

export interface GetTemplesInput {
  page: number;
  limit: number;
  search?: string;
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
  getTempleDetails(id: string): Promise<TempleDetailsResponse>;
  createTemple(
    input: CreateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<TempleResponse>;
  updateTemple(
    id: string,
    input: UpdateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<TempleResponse>;
  deleteTemple(id: string): Promise<TempleResponse>;
}
