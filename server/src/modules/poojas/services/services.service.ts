import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Language, Prisma, ZohoSyncStatus } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import type { IImageService } from '../../../common/image/interfaces/image-service.interface';
import { ZOHO_BOOKS_SERVICE } from '../../temples/constants/service-tokens.const';
import type { IZohoBooksService } from '../../temples/services/zoho-books.service.interface';
import type { CreatePoojaDto } from '../dtos/create-pooja.dto';
import type { UpdatePoojaDto } from '../dtos/update-pooja.dto';
import { createSlug } from '../../../common/utils/slug.util';
import type {
  GetPoojasInput,
  IPoojaService,
  PaginatedPoojas,
  OpsPoojaDetailsResponse,
  OpsPoojaResponse,
  PoojaDetails,
  PoojaDetailsResponse,
  PoojaResponse,
  PoojaWithRelations,
} from './pooja.service.interface';

const MAX_POOJA_IMAGES = 4;

@Injectable()
export class ServicesService implements IPoojaService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
    @Inject(IMAGE_SERVICE)
    private readonly _imageService: IImageService,
    @Inject(ZOHO_BOOKS_SERVICE)
    private readonly _zohoBooksService: IZohoBooksService,
  ) {}

  async getPoojas({
    page,
    limit,
    search,
    category,
    benefitSlug,

    templeSlug,
  }: GetPoojasInput): Promise<PaginatedPoojas> {
    const normalizedSearch = search?.trim();
    const normalizedCategory = category?.trim().toLowerCase();
    const selectedBenefitSlug = benefitSlug?.trim();
    const filters: Prisma.PoojaWhereInput[] = [];

    if (normalizedSearch) {
      filters.push({
        OR: [
          { poojaDay: { contains: normalizedSearch, mode: 'insensitive' } },
          { time: { contains: normalizedSearch, mode: 'insensitive' } },
          {
            translations: {
              some: {
                OR: [
                  {
                    name: { contains: normalizedSearch, mode: 'insensitive' },
                  },
                  {
                    about: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
          {
            temple: {
              translations: {
                some: {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (normalizedCategory === 'weekly') {
      filters.push({ isWeekly: true });
    }

    if (selectedBenefitSlug) {
      filters.push({ benefits: { some: { slug: selectedBenefitSlug } } });
    }

    if (templeSlug?.trim()) {
      filters.push({ temple: { slug: templeSlug.trim() } });
    }

    const where: Prisma.PoojaWhereInput | undefined =
      filters.length > 0 ? { AND: filters } : undefined;
    const skip = (page - 1) * limit;
    const [poojas, total] = await Promise.all([
      this._prismaService.pooja.findMany({
        where,
        include: this._poojaInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.pooja.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = poojas.map((pooja) => this._createPoojaResponse(pooja));

    return {
      items,
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

  async getPoojaDetailsBySlug(slug: string): Promise<PoojaDetailsResponse> {
    const pooja = await this._prismaService.pooja.findUnique({
      where: { slug },
      include: {
        ...this._poojaInclude(),
        _count: { select: { bookings: true } },
      },
    });

    if (!pooja) throw new NotFoundException('Pooja not found');

    return this._createPoojaDetailsResponse(pooja);
  }

  async getPoojaDetails(id: string): Promise<OpsPoojaDetailsResponse> {
    const pooja = await this._prismaService.pooja.findUnique({
      where: { id },
      include: {
        ...this._poojaInclude(),
        _count: { select: { bookings: true } },
      },
    });

    if (!pooja) {
      throw new NotFoundException('Pooja not found');
    }

    return this._createOpsPoojaDetailsResponse(pooja);
  }

  async createPooja(
    input: CreatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<OpsPoojaResponse> {
    this._validateRequiredImageCount(images);
    await this._validateOfferings(input.offeringIds ?? []);
    const imageKeys = await this._uploadImages(images ?? []);
    let pooja: PoojaWithRelations;

    try {
      pooja = await this._prismaService.pooja.create({
        data: {
          slug: createSlug(
            input.translations.find((item) => item.language === 'EN')?.name ??
              input.translations[0]?.name ??
              '',
          ),
          templeId: input.templeId,
          baseAmount: input.baseAmount,
          imageKeys,
          poojaDay: input.poojaDay,
          time: input.time,
          isWeekly: input.isWeekly,
          benefits: {
            connect: input.benefitIds.map((id) => ({ id })),
          },
          offerings: input.offeringIds?.length
            ? {
                connect: input.offeringIds.map((id) => ({ id })),
              }
            : undefined,
          translations: {
            create: input.translations,
          },
        },
        include: this._poojaInclude(),
      });
    } catch (error) {
      await this._queueImageDeletes(imageKeys);
      throw error;
    }

    const synced = await this._syncPoojaWithZoho(pooja);
    const response = { ...synced };
    delete (response as Partial<typeof response>)._count;
    return {
      ...response,
      imageUrls: pooja.imageKeys
        .map((imageKey) => this._imageService.getCardImage(imageKey))
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
    };
  }
  async updatePooja(
    id: string,
    input: UpdatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<OpsPoojaResponse> {
    this._validateOptionalImageCount(images);
    if (input.offeringIds) {
      await this._validateOfferings(input.offeringIds ?? []);
    }
    const existingPooja = await this._getPoojaImages(id);
    this._validateImageSlots(images, input.imageSlots);
    const uploadedImageKeys = images?.length
      ? await this._uploadImages(images)
      : undefined;
    const imageKeys = uploadedImageKeys
      ? this._mergeImageKeys(
          existingPooja.imageKeys,
          uploadedImageKeys,
          input.imageSlots,
        )
      : undefined;
    const replacedImageKeys = uploadedImageKeys
      ? this._getReplacedImageKeys(existingPooja.imageKeys, input.imageSlots)
      : [];

    try {
      const pooja = await this._prismaService.pooja.update({
        where: { id },
        data: {
          templeId: input.templeId,
          baseAmount: input.baseAmount,
          imageKeys,
          poojaDay: input.poojaDay,
          time: input.time,
          isWeekly: input.isWeekly,
          benefits: input.benefitIds
            ? {
                set: input.benefitIds.map((benefitId) => ({ id: benefitId })),
              }
            : undefined,
          offerings: input.offeringIds
            ? {
                set: input.offeringIds.map((offeringId) => ({
                  id: offeringId,
                })),
              }
            : undefined,
          translations: input.translations
            ? {
                upsert: input.translations.map((translation) => ({
                  where: {
                    poojaId_language: {
                      poojaId: id,
                      language: translation.language,
                    },
                  },
                  create: translation,
                  update: {
                    name: translation.name,
                    about: translation.about,
                  },
                })),
              }
            : undefined,
        },
        include: this._poojaInclude(),
      });

      if (imageKeys) {
        await this._queueImageDeletes(replacedImageKeys);
      }

      return this._updatePoojaInZoho(pooja);
    } catch (error) {
      await this._queueImageDeletes(uploadedImageKeys ?? []);
      throw error;
    }
  }

  async deletePooja(id: string): Promise<PoojaResponse> {
    await this.getPoojaDetails(id);

    const deletedPooja = await this._prismaService.pooja.delete({
      where: { id },
      include: this._poojaInclude(),
    });

    await this._queueImageDeletes(deletedPooja.imageKeys);

    return this._createPoojaResponse(deletedPooja);
  }

  async syncPoojaWithZoho(id: string): Promise<OpsPoojaDetailsResponse> {
    const pooja = await this._prismaService.pooja.findUnique({
      where: { id },
      include: {
        ...this._poojaInclude(),
        _count: { select: { bookings: true } },
      },
    });
    if (!pooja) throw new NotFoundException('Pooja not found');
    if (pooja.zohoItemId) return this._createOpsPoojaDetailsResponse(pooja);

    return this._syncPoojaWithZoho(pooja);
  }

  private async _updatePoojaInZoho(
    pooja: PoojaWithRelations,
  ): Promise<OpsPoojaResponse> {
    if (!pooja.zohoItemId) {
      const synced = await this._syncPoojaWithZoho(pooja);
      const response = { ...synced };
      delete (response as Partial<typeof response>)._count;
      return {
        ...response,
        imageUrls: pooja.imageKeys
          .map((imageKey) => this._imageService.getCardImage(imageKey))
          .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
      };
    }

    await this._prismaService.pooja.update({
      where: { id: pooja.id },
      data: { zohoSyncStatus: ZohoSyncStatus.PENDING, zohoSyncError: null },
    });
    const english =
      pooja.translations.find((item) => item.language === Language.EN) ??
      pooja.translations[0];

    try {
      if (!pooja.temple.zohoVendorId) {
        throw new Error('Temple must be synced with Zoho before its Poojas');
      }
      await this._zohoBooksService.updateItem({
        poojaId: pooja.id,
        itemId: pooja.zohoItemId,
        vendorId: pooja.temple.zohoVendorId,
        name: english?.name ?? pooja.slug,
        description: english?.about,
        rate: Number(pooja.baseAmount),
      });
      const synced = await this._prismaService.pooja.update({
        where: { id: pooja.id },
        data: {
          zohoSyncStatus: ZohoSyncStatus.SYNCED,
          zohoSyncError: null,
          lastZohoSyncAt: new Date(),
        },
        include: this._poojaInclude(),
      });
      return this._createOpsPoojaResponse(synced);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown Zoho sync error';
      const failed = await this._prismaService.pooja.update({
        where: { id: pooja.id },
        data: {
          zohoSyncStatus: ZohoSyncStatus.FAILED,
          zohoSyncError: message,
        },
        include: this._poojaInclude(),
      });
      return this._createOpsPoojaResponse(failed);
    }
  }
  private async _syncPoojaWithZoho(
    pooja: PoojaWithRelations | PoojaDetails,
  ): Promise<OpsPoojaDetailsResponse> {
    await this._prismaService.pooja.update({
      where: { id: pooja.id },
      data: { zohoSyncStatus: ZohoSyncStatus.PENDING, zohoSyncError: null },
    });
    const english =
      pooja.translations.find((item) => item.language === Language.EN) ??
      pooja.translations[0];

    try {
      if (!pooja.temple.zohoVendorId) {
        throw new Error('Temple must be synced with Zoho before its Poojas');
      }
      const { itemId } = await this._zohoBooksService.createItem({
        poojaId: pooja.id,
        vendorId: pooja.temple.zohoVendorId,
        name: english?.name ?? pooja.slug,
        description: english?.about,
        rate: Number(pooja.baseAmount),
      });
      const synced = await this._prismaService.pooja.update({
        where: { id: pooja.id },
        data: {
          zohoItemId: itemId,
          zohoSyncStatus: ZohoSyncStatus.SYNCED,
          zohoSyncError: null,
          lastZohoSyncAt: new Date(),
        },
        include: {
          ...this._poojaInclude(),
          _count: { select: { bookings: true } },
        },
      });
      return this._createOpsPoojaDetailsResponse(synced);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown Zoho sync error';
      const failed = await this._prismaService.pooja.update({
        where: { id: pooja.id },
        data: {
          zohoSyncStatus: ZohoSyncStatus.FAILED,
          zohoSyncError: message,
        },
        include: {
          ...this._poojaInclude(),
          _count: { select: { bookings: true } },
        },
      });
      return this._createOpsPoojaDetailsResponse(failed);
    }
  }

  private async _validateOfferings(offeringIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(offeringIds)];
    if (uniqueIds.length === 0) {
      return;
    }
    const count = await this._prismaService.offering.count({
      where: { id: { in: uniqueIds }, isActive: true, deletedAt: null },
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more offerings do not exist or are inactive',
      );
    }
  }

  private _validateRequiredImageCount(images?: UploadedStorageFile[]): void {
    this._validateImageCount(images);

    if (!images?.length) {
      throw new BadRequestException('At least one pooja image is required');
    }
  }

  private _validateOptionalImageCount(images?: UploadedStorageFile[]): void {
    this._validateImageCount(images);
  }

  private _validateImageCount(images?: UploadedStorageFile[]): void {
    if ((images?.length ?? 0) > MAX_POOJA_IMAGES) {
      throw new BadRequestException('Pooja can have a maximum of 4 images');
    }
  }

  private _validateImageSlots(
    images?: UploadedStorageFile[],
    imageSlots?: number[],
  ): void {
    if (!imageSlots) return;
    if (imageSlots.length !== (images?.length ?? 0)) {
      throw new BadRequestException(
        'Each uploaded pooja image must have a matching image slot',
      );
    }
    if (
      new Set(imageSlots).size !== imageSlots.length ||
      imageSlots.some(
        (slot) =>
          !Number.isInteger(slot) || slot < 0 || slot >= MAX_POOJA_IMAGES,
      )
    ) {
      throw new BadRequestException(
        'Pooja image slots must be unique values from 0 to 3',
      );
    }
  }

  private _mergeImageKeys(
    existingImageKeys: string[],
    uploadedImageKeys: string[],
    imageSlots?: number[],
  ): string[] {
    if (!imageSlots) return uploadedImageKeys;
    const mergedImageKeys = [...existingImageKeys];
    imageSlots.forEach((slot, index) => {
      mergedImageKeys[slot] = uploadedImageKeys[index];
    });
    return mergedImageKeys.filter(Boolean).slice(0, MAX_POOJA_IMAGES);
  }

  private _getReplacedImageKeys(
    existingImageKeys: string[],
    imageSlots?: number[],
  ): string[] {
    if (!imageSlots) return existingImageKeys;
    return imageSlots
      .map((slot) => existingImageKeys[slot])
      .filter((imageKey): imageKey is string => Boolean(imageKey));
  }
  private async _uploadImages(
    images: UploadedStorageFile[],
  ): Promise<string[]> {
    return Promise.all(
      images.map((image) =>
        this._fileStorageService.uploadFile(image, 'poojas'),
      ),
    );
  }

  private async _getPoojaImages(id: string): Promise<{ imageKeys: string[] }> {
    const pooja = await this._prismaService.pooja.findUnique({
      where: { id },
      select: { imageKeys: true },
    });

    if (!pooja) {
      throw new NotFoundException('Pooja not found');
    }

    return pooja;
  }

  private _createPoojaDetailsResponse(
    pooja: PoojaDetails,
  ): PoojaDetailsResponse {
    const response = this._createPoojaResponse(pooja);
    const imageUrls = pooja.imageKeys
      .map((imageKey) => this._imageService.getGalleryImage(imageKey))
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

    return { ...response, imageUrls };
  }
  private _createOpsPoojaDetailsResponse(
    pooja: PoojaDetails,
  ): OpsPoojaDetailsResponse {
    return {
      ...this._createPoojaDetailsResponse(pooja),
      zohoItemId: pooja.zohoItemId,
      zohoSyncStatus: pooja.zohoSyncStatus,
      zohoSyncError: pooja.zohoSyncError,
      lastZohoSyncAt: pooja.lastZohoSyncAt,
    };
  }

  private _createOpsPoojaResponse(pooja: PoojaWithRelations): OpsPoojaResponse {
    return {
      ...this._createPoojaResponse(pooja),
      zohoItemId: pooja.zohoItemId,
      zohoSyncStatus: pooja.zohoSyncStatus,
      zohoSyncError: pooja.zohoSyncError,
      lastZohoSyncAt: pooja.lastZohoSyncAt,
    };
  }
  private _createPoojaResponse(pooja: PoojaDetails): PoojaDetailsResponse;
  private _createPoojaResponse(pooja: PoojaWithRelations): PoojaResponse;
  private _createPoojaResponse(
    pooja: PoojaWithRelations | PoojaDetails,
  ): PoojaResponse | PoojaDetailsResponse {
    const { imageKeys, benefits, offerings, temple, ...response } = pooja;
    delete (response as Partial<typeof response>).zohoItemId;
    delete (response as Partial<typeof response>).zohoSyncStatus;
    delete (response as Partial<typeof response>).zohoSyncError;
    delete (response as Partial<typeof response>).lastZohoSyncAt;
    const imageUrls = imageKeys.map((imageKey) =>
      this._imageService.getCardImage(imageKey),
    );

    return {
      ...response,
      imageUrls: imageUrls.filter((imageUrl): imageUrl is string =>
        Boolean(imageUrl),
      ),
      benefits: (benefits ?? []).map(({ imageKey, ...benefit }) => ({
        ...benefit,
        imageUrl: this._imageService.getThumbnail(imageKey),
      })),
      offerings: (offerings ?? []).map(({ imageKey, ...offering }) => ({
        ...offering,
        imageUrl: this._imageService.getThumbnail(imageKey),
      })),
      temple: this._createTempleImageResponse(temple),
    };
  }

  private _createTempleImageResponse(
    temple: PoojaWithRelations['temple'],
  ): Omit<PoojaWithRelations['temple'], 'imageKey' | 'zohoVendorId'> & {
    imageUrl: string | null;
  } {
    const response = { ...temple };
    delete (response as Partial<typeof temple>).imageKey;
    delete (response as typeof temple & { email?: string }).email;
    delete (response as Partial<typeof temple>).zohoVendorId;
    return {
      ...response,
      imageUrl: this._imageService.getThumbnail(temple.imageKey),
    };
  }

  private async _queueImageDeletes(imageKeys: string[]): Promise<void> {
    await Promise.all(
      imageKeys.map((imageKey) =>
        this._fileStorageService.queueDeleteFile(imageKey),
      ),
    );
  }

  private _poojaInclude() {
    return {
      translations: true,
      benefits: { include: { translations: true } },
      offerings: {
        where: { isActive: true, deletedAt: null },
        include: { translations: true },
      },
      temple: {
        select: {
          id: true,
          slug: true,
          imageKey: true,
          state: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          translations: true,
          zohoVendorId: true,
        },
      },
    } satisfies Prisma.PoojaInclude;
  }
}
