import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateOfferingDto } from '../dto/create-offering.dto';
import type { GetOfferingsQueryDto } from '../dto/get-offerings-query.dto';
import type { UpdateOfferingDto } from '../dto/update-offering.dto';
import type {
  OfferingResponse,
  OpsOfferingResponse,
} from '../entities/offering.entity';

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

export interface PaginatedOpsOfferings extends Omit<
  PaginatedOfferings,
  'items'
> {
  items: OpsOfferingResponse[];
}

export interface IOfferingService {
  getOfferings(query: GetOfferingsQueryDto): Promise<PaginatedOfferings>;
  getOpsOfferings(query: GetOfferingsQueryDto): Promise<PaginatedOpsOfferings>;
  getOfferingDetailsBySlug(slug: string): Promise<OfferingResponse>;
  getOfferingDetails(id: string): Promise<OpsOfferingResponse>;
  createOffering(
    input: CreateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse>;
  updateOffering(
    id: string,
    input: UpdateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse>;
  deleteOffering(id: string): Promise<OpsOfferingResponse>;
  syncOfferingWithZoho(id: string): Promise<OpsOfferingResponse>;
}
