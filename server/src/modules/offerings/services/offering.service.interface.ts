import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateOfferingDto } from '../dto/create-offering.dto';
import type { GetOfferingsQueryDto } from '../dto/get-offerings-query.dto';
import type { UpdateOfferingDto } from '../dto/update-offering.dto';
import type { OfferingResponse } from '../entities/offering.entity';

export interface PaginatedOfferings {
  items: OfferingResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IOfferingService {
  getOfferings(query: GetOfferingsQueryDto): Promise<PaginatedOfferings>;
  getOfferingDetails(id: string): Promise<OfferingResponse>;
  createOffering(
    input: CreateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OfferingResponse>;
  updateOffering(
    id: string,
    input: UpdateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OfferingResponse>;
  deleteOffering(id: string): Promise<OfferingResponse>;
}
