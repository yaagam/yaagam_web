import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreateTempleDto } from '../dtos/create-temple.dto';
import type { UpdateTempleDto } from '../dtos/update-temple.dto';
import type {
  GetTemplesInput,
  ITempleService,
  PaginatedTemples,
  TempleDetails,
  TempleDetailsResponse,
  TempleResponse,
} from './temple.service.interface';

@Injectable()
export class ServicesService implements ITempleService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
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
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.temple.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = await Promise.all(
      temples.map((temple) => this._createTempleResponse(temple)),
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

  async getTempleDetails(id: string): Promise<TempleDetailsResponse> {
    const temple = await this._prismaService.temple.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: { select: { poojas: true, bookings: true } },
      },
    });

    if (!temple) {
      throw new NotFoundException('Temple not found');
    }

    return this._createTempleResponse(temple);
  }

  async createTemple(
    input: CreateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<TempleResponse> {
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'temples')
      : undefined;

    try {
      const temple = await this._prismaService.temple.create({
        data: {
          state: input.state,
          description: input.description,
          imageKey,
          translations: {
            create: input.translations,
          },
        },
        include: { translations: true },
      });

      return this._createTempleResponse(temple);
    } catch (error) {
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(imageKey);
      }

      throw error;
    }
  }

  async updateTemple(
    id: string,
    input: UpdateTempleDto,
    image?: UploadedStorageFile,
  ): Promise<TempleResponse> {
    const existingTemple = await this._getTempleImage(id);
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'temples')
      : undefined;

    try {
      const temple = await this._prismaService.temple.update({
        where: { id },
        data: {
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
                  },
                })),
              }
            : undefined,
        },
        include: { translations: true },
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

  async deleteTemple(id: string): Promise<TempleResponse> {
    const temple = await this.getTempleDetails(id);

    if (temple._count.poojas > 0 || temple._count.bookings > 0) {
      throw new ConflictException(
        'Temple cannot be deleted because it has poojas or bookings linked to it',
      );
    }

    const deletedTemple = await this._prismaService.temple.delete({
      where: { id },
      include: { translations: true },
    });

    if (deletedTemple.imageKey) {
      await this._queueImageDelete(deletedTemple.imageKey);
    }

    return this._createTempleResponse(deletedTemple);
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

  private async _createTempleResponse<T extends { imageKey: string | null }>(
    temple: T,
  ): Promise<T & { imageUrl: string | null }> {
    const imageUrl = await this._fileStorageService.createSecureUrl(
      temple.imageKey,
    );

    return { ...temple, imageUrl };
  }

  private async _queueImageDelete(imageKey: string): Promise<void> {
    await this._fileStorageService.queueDeleteFile(imageKey);
  }
}
