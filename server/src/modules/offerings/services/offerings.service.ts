import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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
} from '../entities/offering.entity';
import type { IOfferingRepository } from '../repositories/offering.repository.interface';
import { toOfferingTranslations } from '../translations/offering-translation.mapper';
import { createSlug } from '../../../common/utils/slug.util';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import type { IImageService } from '../../../common/image/interfaces/image-service.interface';
import type {
  IOfferingService,
  PaginatedOfferings,
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
  ) {}

  async getOfferings({
    page,
    limit,
    search,
    isActive,
  }: GetOfferingsQueryDto): Promise<PaginatedOfferings> {
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
      items: offerings.map((offering) => this._toResponse(offering)),
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

  async getOfferingDetails(id: string): Promise<OfferingResponse> {
    const offering = await this._getExisting(id);
    return this._toResponse(offering);
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
  ): Promise<OfferingResponse> {
    if (!image) {
      throw new BadRequestException('Offering image is required');
    }
    this._validatePrices(input.actualPrice, input.discountPrice);
    const imageKey = await this._fileStorageService.uploadFile(
      image,
      'offerings',
    );
    try {
      const offering = await this._offeringRepository.create({
        slug: createSlug(
          input.translations.find((item) => item.language === 'EN')?.name ??
            input.translations[0].name,
        ),
        imageKey,
        actualPrice: input.actualPrice,
        discountPrice: input.discountPrice,
        isActive: input.isActive,
        translations: {
          create: toOfferingTranslations(input.translations),
        },
      });
      return this._toResponse(offering);
    } catch (error) {
      await this._fileStorageService.queueDeleteFile(imageKey);
      throw error;
    }
  }

  async updateOffering(
    id: string,
    input: UpdateOfferingDto,
    image?: UploadedStorageFile,
  ): Promise<OfferingResponse> {
    const existing = await this._getExisting(id);
    this._validatePrices(
      input.actualPrice ?? Number(existing.actualPrice),
      input.discountPrice ?? Number(existing.discountPrice),
    );
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'offerings')
      : undefined;
    try {
      const offering = await this._offeringRepository.update(id, {
        imageKey,
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
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(existing.imageKey);
      }
      return this._toResponse(offering);
    } catch (error) {
      if (imageKey) await this._fileStorageService.queueDeleteFile(imageKey);
      throw error;
    }
  }

  async deleteOffering(id: string): Promise<OfferingResponse> {
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
    return this._toResponse(deleted);
  }

  private async _getExisting(id: string): Promise<OfferingEntity> {
    const offering = await this._offeringRepository.findById(id);
    if (!offering || offering.deletedAt) {
      throw new NotFoundException('Offering not found');
    }
    return offering;
  }

  private _validatePrices(actualPrice: number, discountPrice: number): void {
    if (actualPrice <= 0) {
      throw new BadRequestException('actualPrice must be greater than zero');
    }
    if (discountPrice < 0 || discountPrice > actualPrice) {
      throw new BadRequestException(
        'discountPrice must be between zero and actualPrice',
      );
    }
  }

  private _toResponse(offering: OfferingEntity): OfferingResponse {
    const { imageKey, ...response } = offering;
    return {
      ...response,
      imageUrl: this._imageService.getThumbnail(imageKey),
    };
  }
}
