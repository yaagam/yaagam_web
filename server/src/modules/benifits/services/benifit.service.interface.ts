import type { Prisma } from '@prisma/client';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateBenifitDto } from '../dtos/create-benifit.dto';
import type { UpdateBenifitDto } from '../dtos/update-benifit.dto';

export type BenifitWithTranslations = Prisma.BenefitGetPayload<{
  include: { translations: true };
}>;

export type BenifitDetails = Prisma.BenefitGetPayload<{
  include: {
    translations: true;
    _count: { select: { poojas: true } };
  };
}>;

export type BenifitResponse = BenifitWithTranslations & {
  imageUrl: string | null;
};

export type BenifitDetailsResponse = BenifitDetails & {
  imageUrl: string | null;
};

export interface GetBenifitsInput {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedBenifits {
  items: BenifitResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IBenifitService {
  getBenifits(input: GetBenifitsInput): Promise<PaginatedBenifits>;
  getBenifitDetails(id: string): Promise<BenifitDetailsResponse>;
  createBenifit(
    input: CreateBenifitDto,
    image?: UploadedStorageFile,
  ): Promise<BenifitResponse>;
  updateBenifit(
    id: string,
    input: UpdateBenifitDto,
    image?: UploadedStorageFile,
  ): Promise<BenifitResponse>;
  deleteBenifit(id: string): Promise<BenifitResponse>;
}
