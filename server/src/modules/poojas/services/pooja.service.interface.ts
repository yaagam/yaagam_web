import type { Prisma, ZohoSyncStatus } from '@prisma/client';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreatePoojaDto } from '../dtos/create-pooja.dto';
import type { UpdatePoojaDto } from '../dtos/update-pooja.dto';

export type PoojaWithRelationsPayload = Prisma.PoojaGetPayload<{
  include: {
    translations: true;
    benefits: { include: { translations: true } };
    offerings: { include: { translations: true } };
    temple: {
      select: {
        id: true;
        isActive: true;
        imageKey: true;
        state: true;
        description: true;
        templePriest: true;
        createdAt: true;
        updatedAt: true;
        translations: true;
        zohoVendorId: true;
      };
    };
  };
}>;

export type PoojaDetailsPayload = Prisma.PoojaGetPayload<{
  include: {
    translations: true;
    benefits: { include: { translations: true } };
    offerings: { include: { translations: true } };
    temple: {
      select: {
        id: true;
        isActive: true;
        imageKey: true;
        state: true;
        description: true;
        templePriest: true;
        createdAt: true;
        updatedAt: true;
        translations: true;
        zohoVendorId: true;
      };
    };
    _count: { select: { bookings: true } };
  };
}>;

export type PoojaWithRelations = PoojaWithRelationsPayload;

export type PoojaDetails = PoojaDetailsPayload;

type ZohoPoojaFields = {
  templeAmount: Prisma.Decimal;
  zohoItemId: string | null;
  zohoSyncStatus: ZohoSyncStatus;
  zohoSyncError: string | null;
  lastZohoSyncAt: Date | null;
};

type ZohoOfferingFieldNames =
  | 'zohoItemId'
  | 'zohoSyncStatus'
  | 'zohoSyncError'
  | 'lastZohoSyncAt';

type PublicPoojaResponse<T extends PoojaWithRelationsPayload> = Omit<
  T,
  | 'imageKeys'
  | 'mantraAudioKey'
  | 'benefits'
  | 'offerings'
  | 'temple'
  | 'templeAmount'
  | keyof ZohoPoojaFields
> & {
  imageUrls: string[];
  mantraAudioUrl: string | null;
  benefits: Array<
    Omit<T['benefits'][number], 'imageKey'> & { imageUrl: string | null }
  >;
  offerings: Array<
    Omit<
      T['offerings'][number],
      'imageKey' | 'templeAmount' | ZohoOfferingFieldNames
    > & {
      imageUrl: string | null;
    }
  >;
  temple: Omit<T['temple'], 'imageKey' | 'zohoVendorId'> & {
    imageUrl: string | null;
  };
};

export type PoojaResponse = PublicPoojaResponse<PoojaWithRelationsPayload>;

export type PoojaDetailsResponse = PublicPoojaResponse<PoojaDetailsPayload>;
export type OpsPoojaResponse = PoojaResponse & ZohoPoojaFields;
export type OpsPoojaDetailsResponse = PoojaDetailsResponse & ZohoPoojaFields;

export interface GetPoojasInput {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  benefitSlug?: string;

  templeSlug?: string;
  isActive?: boolean;
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
  getOpsPoojas(input: GetPoojasInput): Promise<PaginatedPoojas>;
  getPoojaDetailsBySlug(slug: string): Promise<PoojaDetailsResponse>;
  getPoojaDetails(id: string): Promise<OpsPoojaDetailsResponse>;
  createPooja(
    input: CreatePoojaDto,
    images?: UploadedStorageFile[],
    mantraAudio?: UploadedStorageFile,
  ): Promise<OpsPoojaResponse>;
  updatePooja(
    id: string,
    input: UpdatePoojaDto,
    images?: UploadedStorageFile[],
    mantraAudio?: UploadedStorageFile,
  ): Promise<OpsPoojaResponse>;
  deletePooja(id: string): Promise<PoojaResponse>;
  syncPoojaWithZoho(id: string): Promise<OpsPoojaDetailsResponse>;
}
