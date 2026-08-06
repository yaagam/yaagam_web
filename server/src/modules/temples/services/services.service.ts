import {
  ConflictException,
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
import { ZOHO_BOOKS_SERVICE } from '../constants/service-tokens.const';
import type { IZohoBooksService } from './zoho-books.service.interface';
import type { CreateTempleDto } from '../dtos/create-temple.dto';
import type { TempleTranslationDto } from '../dtos/temple-translation.dto';
import type { UpdateTempleDto } from '../dtos/update-temple.dto';
import { createSlug } from '../../../common/utils/slug.util';
import type {
  GetTemplesInput,
  ITempleService,
  PaginatedTemples,
  OpsTempleDetailsResponse,
  OpsTempleWithTranslations,
  OpsTempleResponse,
  TempleDetailsResponse,
} from './temple.service.interface';

@Injectable()
export class ServicesService implements ITempleService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
    @Inject(IMAGE_SERVICE)
    private readonly _imageService: IImageService,
    @Inject(ZOHO_BOOKS_SERVICE)
    private readonly _zohoBooksService: IZohoBooksService,
  ) {}

  async getTemples({
    page,
    limit,
    search,
  }: GetTemplesInput): Promise<PaginatedTemples> {
    const normalizedSearch = search?.trim();
    const where: Prisma.TempleWhereInput | undefined = normalizedSearch
      ? {
          OR: [
            { state: { contains: normalizedSearch, mode: 'insensitive' } },
            {
              description: {
                contains: normalizedSearch,
                mode: 'insensitive',
              },
            },
            {
              translations: {
                some: {
                  OR: [
                    {
                      name: { contains: normalizedSearch, mode: 'insensitive' },
                    },
                    {
                      district: {
                        contains: normalizedSearch,
                        mode: 'insensitive',
                      },
                    },
                    {
                      place: {
                        contains: normalizedSearch,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: normalizedSearch,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : undefined;
    const skip = (page - 1) * limit;
    const [temples, total] = await Promise.all([
      this._prismaService.temple.findMany({
        where,
        select: this._templeSelect(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.temple.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = temples.map((temple) =>
      this._createPublicTempleResponse(temple),
    );

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

  async getTempleDetailsBySlug(slug: string): Promise<TempleDetailsResponse> {
    const temple = await this._prismaService.temple.findUnique({
      where: { slug },
      select: this._publicTempleDetailsSelect(),
    });

    if (!temple) throw new NotFoundException('Temple not found');

    return this._createPublicTempleDetailsResponse(temple);
  }

  async getTempleDetails(id: string): Promise<OpsTempleDetailsResponse> {
    const temple = await this._prismaService.temple.findUnique({
      where: { id },
      select: this._opsTempleDetailsSelect(),
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return this._createTempleResponse(temple);
  }

  async createTemple(
    input: CreateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<OpsTempleResponse> {
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'temples')
      : undefined;
    let temple: OpsTempleWithTranslations;

    try {
      temple = await this._prismaService.temple.create({
        data: {
          slug: createSlug(
            input.translations?.find((item) => item.language === 'EN')?.name ??
              input.translations?.[0]?.name ??
              input.name ??
              '',
          ),
          email: input.email,
          state: input.state,
          description: input.description,
          imageKey,
          translations: {
            create: this._getCreateTempleTranslations(input),
          },
        },
        select: this._opsTempleSelect(),
      });
    } catch (error) {
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(imageKey);
      }
      throw error;
    }

    return this._syncTempleWithZoho(temple);
  }
  async updateTemple(
    id: string,
    input: UpdateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<OpsTempleResponse> {
    const existingTemple = await this._getTempleImage(id);
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'temples')
      : undefined;

    try {
      const temple = await this._prismaService.temple.update({
        where: { id },
        data: {
          email: input.email,
          state: input.state,
          description: input.description,
          imageKey,
          translations: input.translations
            ? {
                upsert: input.translations.map((translation) => ({
                  where: {
                    templeId_language: {
                      templeId: id,
                      language: translation.language,
                    },
                  },
                  create: translation,
                  update: {
                    name: translation.name,
                    district: translation.district,
                    place: translation.place,
                    description: translation.description,
                  },
                })),
              }
            : undefined,
        },
        select: this._opsTempleSelect(),
      });

      if (imageKey && existingTemple.imageKey) {
        await this._queueImageDelete(existingTemple.imageKey);
      }

      return this._createTempleResponse(temple);
    } catch (error) {
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(imageKey);
      }

      throw error;
    }
  }

  async deleteTemple(id: string): Promise<OpsTempleResponse> {
    const temple = await this.getTempleDetails(id);

    if (temple._count.poojas > 0 || temple._count.bookings > 0) {
      throw new ConflictException(
        'Temple cannot be deleted because it has poojas or bookings linked to it',
      );
    }

    const deletedTemple = await this._prismaService.temple.delete({
      where: { id },
      select: this._opsTempleSelect(),
    });

    if (deletedTemple.imageKey) {
      await this._queueImageDelete(deletedTemple.imageKey);
    }

    return this._createTempleResponse(deletedTemple);
  }

  async syncTempleWithZoho(id: string): Promise<OpsTempleResponse> {
    const temple = await this._prismaService.temple.findUnique({
      where: { id },
      select: this._opsTempleSelect(),
    });
    if (!temple) throw new NotFoundException('Temple not found');
    if (temple.zohoVendorId) return this._createTempleResponse(temple);

    return this._syncTempleWithZoho(temple);
  }

  private async _syncTempleWithZoho(
    temple: Prisma.TempleGetPayload<{
      select: ReturnType<ServicesService['_opsTempleSelect']>;
    }>,
  ): Promise<OpsTempleResponse> {
    await this._prismaService.temple.update({
      where: { id: temple.id },
      data: { zohoSyncStatus: ZohoSyncStatus.PENDING, zohoSyncError: null },
    });
    const english =
      temple.translations.find((item) => item.language === Language.EN) ??
      temple.translations[0];

    try {
      const { vendorId } = await this._zohoBooksService.createVendor({
        templeId: temple.id,
        name: english?.name ?? temple.slug,
        email: temple.email,
        address: {
          address: english?.place,
          city: english?.district,
          state: temple.state,
          country: 'India',
        },
      });
      const synced = await this._prismaService.temple.update({
        where: { id: temple.id },
        data: {
          zohoVendorId: vendorId,
          zohoSyncStatus: ZohoSyncStatus.SYNCED,
          zohoSyncError: null,
          lastZohoSyncAt: new Date(),
        },
        select: this._opsTempleSelect(),
      });
      return this._createTempleResponse(synced);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown Zoho sync error';
      const failed = await this._prismaService.temple.update({
        where: { id: temple.id },
        data: {
          zohoSyncStatus: ZohoSyncStatus.FAILED,
          zohoSyncError: message,
        },
        select: this._opsTempleSelect(),
      });
      return this._createTempleResponse(failed);
    }
  }
  private _getCreateTempleTranslations(
    input: CreateTempleDto,
  ): TempleTranslationDto[] {
    if (input.translations?.length) {
      return input.translations;
    }

    return [
      {
        language: input.language ?? Language.EN,
        name: input.name ?? '',
        district: input.district ?? '',
        place: input.place ?? '',
        description: input.description,
      },
    ];
  }
  private async _getTempleImage(
    id: string,
  ): Promise<{ imageKey: string | null }> {
    const temple = await this._prismaService.temple.findUnique({
      where: { id },
      select: { imageKey: true },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return temple;
  }

  private _createTempleResponse<T extends { imageKey: string | null }>(
    temple: T,
  ): Omit<T, 'imageKey'> & { imageUrl: string | null } {
    const { imageKey, ...response } = temple;
    const imageUrl = this._imageService.getCardImage(imageKey);

    return { ...response, imageUrl };
  }

  private _createPublicTempleResponse<
    T extends { imageKey: string | null; email?: string },
  >(temple: T): Omit<T, 'email' | 'imageKey'> & { imageUrl: string | null } {
    const publicTemple: Partial<T> = { ...temple };
    delete publicTemple.email;
    delete publicTemple.imageKey;
    const imageUrl = this._imageService.getCardImage(temple.imageKey);

    return { ...publicTemple, imageUrl } as Omit<T, 'email' | 'imageKey'> & {
      imageUrl: string | null;
    };
  }

  private _createPublicTempleDetailsResponse<
    T extends { imageKey: string | null; email?: string },
  >(
    temple: T,
  ): Omit<T, 'email' | 'imageKey'> & { heroImageUrl: string | null } {
    const publicTemple: Partial<T> = { ...temple };
    delete publicTemple.email;
    delete publicTemple.imageKey;

    return {
      ...publicTemple,
      heroImageUrl: this._imageService.getHeroImage(temple.imageKey),
    } as Omit<T, 'email' | 'imageKey'> & { heroImageUrl: string | null };
  }
  private async _queueImageDelete(imageKey: string): Promise<void> {
    await this._fileStorageService.queueDeleteFile(imageKey);
  }

  private _templeSelect() {
    return {
      id: true,
      slug: true,
      imageKey: true,
      state: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      translations: true,
    } satisfies Prisma.TempleSelect;
  }

  private _opsTempleSelect() {
    return {
      ...this._templeSelect(),
      email: true,
      zohoVendorId: true,
      zohoSyncStatus: true,
      zohoSyncError: true,
      lastZohoSyncAt: true,
    } satisfies Prisma.TempleSelect;
  }

  private _publicTempleDetailsSelect() {
    return {
      ...this._templeSelect(),
      _count: { select: { poojas: true, bookings: true } },
    } satisfies Prisma.TempleSelect;
  }

  private _opsTempleDetailsSelect() {
    return {
      ...this._opsTempleSelect(),
      _count: { select: { poojas: true, bookings: true } },
    } satisfies Prisma.TempleSelect;
  }
}
