import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import type { CreatePoojaDto } from '../dtos/create-pooja.dto';
import type { UpdatePoojaDto } from '../dtos/update-pooja.dto';
import type {
  GetPoojasInput,
  IPoojaService,
  PaginatedPoojas,
  PoojaDetailsResponse,
  PoojaResponse,
} from './pooja.service.interface';

const MAX_POOJA_IMAGES = 4;

@Injectable()
export class ServicesService implements IPoojaService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
  ) {}

  async getPoojas({
    page,
    limit,
    search,
    category,
    benifitId,
    benefitId,
    templeId,
  }: GetPoojasInput): Promise<PaginatedPoojas> {
    const normalizedSearch = search?.trim();
    const normalizedCategory = category?.trim().toLowerCase();
    const selectedBenefitId = benefitId?.trim() || benifitId?.trim();
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

    if (selectedBenefitId) {
      filters.push({ benefits: { some: { id: selectedBenefitId } } });
    }

    if (templeId?.trim()) {
      filters.push({ templeId: templeId.trim() });
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
    const items = await Promise.all(
      poojas.map((pooja) => this._createPoojaResponse(pooja)),
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

  async getPoojaDetails(id: string): Promise<PoojaDetailsResponse> {
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

    return this._createPoojaResponse(pooja);
  }

  async createPooja(
    input: CreatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<PoojaResponse> {
    this._validateRequiredImageCount(images);
    await this._validateOfferings(input.offeringIds ?? []);
    const imageKeys = await this._uploadImages(images ?? []);

    try {
      const pooja = await this._prismaService.pooja.create({
        data: {
          templeId: input.templeId,
          baseAmount: input.baseAmount,
          imageKeys,
          poojaDay: input.poojaDay,
          time: input.time,
          isWeekly: input.isWeekly,
          weeklyDiscount: input.weeklyDiscount,
          normalDiscount: input.normalDiscount,
          benefits: {
            connect: input.benefitIds.map((id) => ({ id })),
          },
          translations: {
            create: input.translations,
          },
        },
        include: this._poojaInclude(),
      });

      return this._createPoojaResponse(pooja);
    } catch (error) {
      await this._queueImageDeletes(imageKeys);
      throw error;
    }
  }

  async updatePooja(
    id: string,
    input: UpdatePoojaDto,
    images?: UploadedStorageFile[],
  ): Promise<PoojaResponse> {
    this._validateOptionalImageCount(images);
    if (input.offeringIds) {
      await this._validateOfferings(input.offeringIds ?? []);
    }
    const existingPooja = await this._getPoojaImages(id);
    const imageKeys = images?.length
      ? await this._uploadImages(images)
      : undefined;

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
          weeklyDiscount: input.weeklyDiscount,
          normalDiscount: input.normalDiscount,
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
        await this._queueImageDeletes(existingPooja.imageKeys);
      }

      return this._createPoojaResponse(pooja);
    } catch (error) {
      await this._queueImageDeletes(imageKeys ?? []);
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

  private async _createPoojaResponse<
    T extends { imageKeys: string[]; temple?: object | null },
  >(
    pooja: T,
  ): Promise<
    Omit<T, 'temple'> & {
      temple:
        | Omit<NonNullable<T['temple']>, 'email'>
        | Extract<T['temple'], null | undefined>;
      imageUrls: string[];
    }
  > {
    const safePooja = this._removeTempleEmail(pooja);
    const imageUrls = await Promise.all(
      pooja.imageKeys.map((imageKey) =>
        this._fileStorageService.createSecureUrl(imageKey),
      ),
    );

    return {
      ...safePooja,
      imageUrls: imageUrls.filter((imageUrl): imageUrl is string =>
        Boolean(imageUrl),
      ),
    };
  }

  private _removeTempleEmail<T extends { temple?: object | null }>(
    pooja: T,
  ): Omit<T, 'temple'> & {
    temple:
      | Omit<NonNullable<T['temple']>, 'email'>
      | Extract<T['temple'], null | undefined>;
  } {
    const { temple, ...poojaWithoutTemple } = pooja;

    if (!temple) {
      return { ...poojaWithoutTemple, temple } as Omit<T, 'temple'> & {
        temple:
          | Omit<NonNullable<T['temple']>, 'email'>
          | Extract<T['temple'], null | undefined>;
      };
    }

    const safeTemple = { ...temple } as NonNullable<T['temple']>;

    delete (safeTemple as NonNullable<T['temple']> & { email?: string }).email;

    return { ...poojaWithoutTemple, temple: safeTemple };
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
          imageKey: true,
          state: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          translations: true,
        },
      },
    } satisfies Prisma.PoojaInclude;
  }
}
