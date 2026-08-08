import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Language, type Prisma, ZohoSyncStatus } from '@prisma/client';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { OFFERING_REPOSITORY } from '../constants/service-tokens.const';
import type { CreateOfferingDto } from '../dto/create-offering.dto';
import type { GetOfferingsQueryDto } from '../dto/get-offerings-query.dto';
import type { UpdateOfferingDto } from '../dto/update-offering.dto';
import type {
  OfferingEntity,
  OfferingResponse,
  OpsOfferingResponse,
} from '../entities/offering.entity';
import type { IOfferingRepository } from '../repositories/offering.repository.interface';
import { toOfferingTranslations } from '../translations/offering-translation.mapper';
import { createSlug } from '../../../common/utils/slug.util';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import type { IImageService } from '../../../common/image/interfaces/image-service.interface';
import { ZOHO_BOOKS_SERVICE } from '../../temples/constants/service-tokens.const';
import type { IZohoBooksService } from '../../temples/services/zoho-books.service.interface';
import type {
  IOfferingService,
  PaginatedOfferings,
  PaginatedOpsOfferings,
} from './offering.service.interface';

@Injectable()
export class OfferingsService implements IOfferingService {
  constructor(
    @Inject(OFFERING_REPOSITORY)
    private readonly _offeringRepository: IOfferingRepository,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
    @Inject(IMAGE_SERVICE)
    private readonly _imageService: IImageService,
    @Inject(ZOHO_BOOKS_SERVICE)
    private readonly _zohoBooksService: IZohoBooksService,
  ) {}

  async getOfferings({
    page,
    limit,
    search,
    isActive,
  }: GetOfferingsQueryDto): Promise<PaginatedOfferings> {
    return this._getOfferings({ page, limit, search, isActive }, false);
  }

  async getOpsOfferings(
    query: GetOfferingsQueryDto,
  ): Promise<PaginatedOpsOfferings> {
    return this._getOfferings(query, true);
  }

  private async _getOfferings(
    { page, limit, search, isActive }: GetOfferingsQueryDto,
    includeTempleAmount: true,
  ): Promise<PaginatedOpsOfferings>;
  private async _getOfferings(
    { page, limit, search, isActive }: GetOfferingsQueryDto,
    includeTempleAmount: false,
  ): Promise<PaginatedOfferings>;
  private async _getOfferings(
    { page, limit, search, isActive }: GetOfferingsQueryDto,
    includeTempleAmount: boolean,
  ): Promise<PaginatedOfferings | PaginatedOpsOfferings> {
    const where: Prisma.OfferingWhereInput = {
      deletedAt: null,
      ...(isActive === undefined ? {} : { isActive }),
      ...(search?.trim()
        ? {
            translations: {
              some: {
                OR: [
                  { name: { contains: search.trim(), mode: 'insensitive' } },
                  {
                    description: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          }
        : {}),
    };
    const skip = (page - 1) * limit;
    const [offerings, total] = await Promise.all([
      this._offeringRepository.findMany(where, skip, limit),
      this._offeringRepository.count(where),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      items: offerings.map((offering) =>
        includeTempleAmount
          ? this._toOpsResponse(offering)
          : this._toResponse(offering),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getOfferingDetails(id: string): Promise<OpsOfferingResponse> {
    const offering = await this._getExisting(id);
    return this._toOpsResponse(offering);
  }

  async getOfferingDetailsBySlug(slug: string): Promise<OfferingResponse> {
    const offering = await this._offeringRepository.findBySlug(slug);
    if (!offering) {
      throw new NotFoundException('Offering not found');
    }
    return this._toResponse(offering);
  }

  async createOffering(
    input: CreateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    if (!image) {
      throw new BadRequestException('Offering image is required');
    }
    this._validatePrices(
      input.templeAmount,
      input.actualPrice,
      input.discountPrice,
    );
    const imageKey = await this._fileStorageService.uploadFile(
      image,
      'offerings',
    );
    let offering: OfferingEntity;

    try {
      offering = await this._offeringRepository.create({
        slug: createSlug(
          input.translations.find((item) => item.language === 'EN')?.name ??
            input.translations[0].name,
        ),
        imageKey,
        templeAmount: input.templeAmount,
        actualPrice: input.actualPrice,
        discountPrice: input.discountPrice,
        isActive: input.isActive,
        translations: {
          create: toOfferingTranslations(input.translations),
        },
      });
    } catch (error) {
      await this._fileStorageService.queueDeleteFile(imageKey);
      throw error;
    }

    return this._synchronizeOfferingWithZoho(offering);
  }

  async updateOffering(
    id: string,
    input: UpdateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    const existing = await this._getExisting(id);
    this._validatePrices(
      input.templeAmount ?? Number(existing.templeAmount),
      input.actualPrice ?? Number(existing.actualPrice),
      input.discountPrice ?? Number(existing.discountPrice),
    );
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'offerings')
      : undefined;
    let offering: OfferingEntity;

    try {
      offering = await this._offeringRepository.update(id, {
        imageKey,
        templeAmount: input.templeAmount,
        actualPrice: input.actualPrice,
        discountPrice: input.discountPrice,
        isActive: input.isActive,
        translations: input.translations
          ? {
              upsert: toOfferingTranslations(input.translations).map(
                (translation) => ({
                  where: {
                    offeringId_language: {
                      offeringId: id,
                      language: translation.language,
                    },
                  },
                  create: translation,
                  update: {
                    name: translation.name,
                    description: translation.description,
                  },
                }),
              ),
            }
          : undefined,
      });
    } catch (error) {
      if (imageKey) await this._fileStorageService.queueDeleteFile(imageKey);
      throw error;
    }

    if (imageKey) {
      await this._fileStorageService.queueDeleteFile(existing.imageKey);
    }

    return this._synchronizeOfferingWithZoho(offering);
  }

  async syncOfferingWithZoho(id: string): Promise<OpsOfferingResponse> {
    const offering = await this._getExisting(id);
    return this._synchronizeOfferingWithZoho(offering);
  }

  async deleteOffering(id: string): Promise<OpsOfferingResponse> {
    const existing = await this._getExisting(id);
    if ((existing._count?.poojas ?? 0) > 0) {
      throw new ConflictException(
        'This offering is associated with one or more poojas.',
      );
    }
    const deleted = await this._offeringRepository.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
    return this._toOpsResponse(deleted);
  }

  private async _getExisting(id: string): Promise<OfferingEntity> {
    const offering = await this._offeringRepository.findById(id);
    if (!offering || offering.deletedAt) {
      throw new NotFoundException('Offering not found');
    }
    return offering;
  }

  private async _synchronizeOfferingWithZoho(
    offering: OfferingEntity,
  ): Promise<OpsOfferingResponse> {
    await this._offeringRepository.update(offering.id, {
      zohoSyncStatus: ZohoSyncStatus.PENDING,
      zohoSyncError: null,
    });
    const english =
      offering.translations.find((item) => item.language === Language.EN) ??
      offering.translations[0];
    const itemInput = {
      offeringId: offering.id,
      name: english?.name ?? offering.slug,
      description: english?.description,
      sellingPrice: Number(offering.discountPrice),
      purchasePrice: Number(offering.templeAmount),
    } as const;

    try {
      let itemId = offering.zohoItemId;

      if (itemId) {
        await this._zohoBooksService.updateItem({
          ...itemInput,
          itemId,
        });
      } else {
        ({ itemId } = await this._zohoBooksService.createItem(itemInput));
      }

      const synced = await this._offeringRepository.update(offering.id, {
        zohoItemId: itemId,
        zohoSyncStatus: ZohoSyncStatus.SYNCED,
        zohoSyncError: null,
        lastZohoSyncAt: new Date(),
      });
      return this._toOpsResponse(synced);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown Zoho sync error';
      const failed = await this._offeringRepository.update(offering.id, {
        zohoSyncStatus: ZohoSyncStatus.FAILED,
        zohoSyncError: message,
      });
      return this._toOpsResponse(failed);
    }
  }

  private _validatePrices(
    templeAmount: number,
    actualPrice: number,
    discountPrice: number,
  ): void {
    if (templeAmount <= 0 || actualPrice <= 0 || discountPrice <= 0) {
      throw new BadRequestException(
        'All Offering prices must be greater than zero',
      );
    }
    if (discountPrice < 0 || discountPrice > actualPrice) {
      throw new BadRequestException(
        'discountPrice must be between zero and actualPrice',
      );
    }
    if (discountPrice < templeAmount) {
      throw new BadRequestException(
        'discountPrice must not be less than templeAmount',
      );
    }
  }

  private _toResponse(offering: OfferingEntity): OfferingResponse {
    const imageKey = offering.imageKey;
    const response = { ...offering };
    delete (response as Partial<OfferingEntity>).imageKey;
    delete (response as Partial<OfferingEntity>).templeAmount;
    delete (response as Partial<OfferingEntity>).zohoItemId;
    delete (response as Partial<OfferingEntity>).zohoSyncStatus;
    delete (response as Partial<OfferingEntity>).zohoSyncError;
    delete (response as Partial<OfferingEntity>).lastZohoSyncAt;
    return {
      ...response,
      imageUrl: this._imageService.getCardImage(imageKey),
    };
  }

  private _toOpsResponse(offering: OfferingEntity): OpsOfferingResponse {
    return {
      ...this._toResponse(offering),
      templeAmount: offering.templeAmount,
      zohoItemId: offering.zohoItemId,
      zohoSyncStatus: offering.zohoSyncStatus,
      zohoSyncError: offering.zohoSyncError,
      lastZohoSyncAt: offering.lastZohoSyncAt,
    };
  }
}
