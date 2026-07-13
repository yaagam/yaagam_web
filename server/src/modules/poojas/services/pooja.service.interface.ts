import type { Prisma } from '@prisma/client';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreatePoojaDto } from '../dtos/create-pooja.dto';
import type { UpdatePoojaDto } from '../dtos/update-pooja.dto';

type PoojaWithRelationsPayload = Prisma.PoojaGetPayload<{
  include: {
    translations: true;
    benefits: { include: { translations: true } };
    temple: { include: { translations: true } };
  };
}>;

type PoojaDetailsPayload = Prisma.PoojaGetPayload<{
  include: {
    translations: true;
    benefits: { include: { translations: true } };
    temple: { include: { translations: true } };
    _count: { select: { bookings: true } };
  };
}>;

type WithoutTempleEmail<T extends { temple: { email: string } }> = Omit<
  T,
  'temple'
> & {
  temple: Omit<T['temple'], 'email'>;
};

export type PoojaWithRelations = WithoutTempleEmail<PoojaWithRelationsPayload>;

export type PoojaDetails = WithoutTempleEmail<PoojaDetailsPayload>;

export type PoojaResponse = PoojaWithRelations & {
  imageUrls: string[];
};

export type PoojaDetailsResponse = PoojaDetails & {
  imageUrls: string[];
};

export interface GetPoojasInput {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  benifitId?: string;
  benefitId?: string;
  templeId?: string;
}

export interface PaginatedPoojas {
  items: PoojaResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IPoojaService {
  getPoojas(input: GetPoojasInput): Promise<PaginatedPoojas>;
  getPoojaDetails(id: string): Promise<PoojaDetailsResponse>;
  createPooja(
    input: CreatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<PoojaResponse>;
  updatePooja(
    id: string,
    input: UpdatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<PoojaResponse>;
  deletePooja(id: string): Promise<PoojaResponse>;
}
