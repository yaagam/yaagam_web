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
import type { CreateBenifitDto } from '../dtos/create-benifit.dto';
import type { UpdateBenifitDto } from '../dtos/update-benifit.dto';
import type {
  BenifitDetailsResponse,
  BenifitResponse,
  GetBenifitsInput,
  IBenifitService,
  PaginatedBenifits,
} from './benifit.service.interface';

@Injectable()
export class ServicesService implements IBenifitService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
  ) {}

  async getBenifits({
    page,
    limit,
    search,
  }: GetBenifitsInput): Promise<PaginatedBenifits> {
    const normalizedSearch = search?.trim();
    const where: Prisma.BenefitWhereInput | undefined = normalizedSearch
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: normalizedSearch, mode: 'insensitive' } },
                {
                  description: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        }
      : undefined;
    const skip = (page - 1) * limit;
    const [benifits, total] = await Promise.all([
      this._prismaService.benefit.findMany({
        where,
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.benefit.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = await Promise.all(
      benifits.map((benifit) => this._createBenifitResponse(benifit)),
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

  async getBenifitDetails(id: string): Promise<BenifitDetailsResponse> {
    const benifit = await this._prismaService.benefit.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: { select: { poojas: true } },
      },
    });

    if (!benifit) {
      throw new NotFoundException('Benifit not found');
    }

    return this._createBenifitResponse(benifit);
  }

  async createBenifit(
    input: CreateBenifitDto,
    image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'benifits')
      : undefined;

    try {
      const benifit = await this._prismaService.benefit.create({
        data: {
          imageKey,
          translations: {
            create: input.translations,
          },
        },
        include: { translations: true },
      });

      return this._createBenifitResponse(benifit);
    } catch (error) {
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(imageKey);
      }

      throw error;
    }
  }

  async updateBenifit(
    id: string,
    input: UpdateBenifitDto,
    image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    const existingBenifit = await this._getBenifitImage(id);
    const imageKey = image
      ? await this._fileStorageService.uploadFile(image, 'benifits')
      : undefined;

    try {
      const benifit = await this._prismaService.benefit.update({
        where: { id },
        data: {
          imageKey,
          translations: input.translations
            ? {
                upsert: input.translations.map((translation) => ({
                  where: {
                    benefitId_language: {
                      benefitId: id,
                      language: translation.language,
                    },
                  },
                  create: translation,
                  update: {
                    name: translation.name,
                    description: translation.description,
                  },
                })),
              }
            : undefined,
        },
        include: { translations: true },
      });

      if (imageKey && existingBenifit.imageKey) {
        await this._queueImageDelete(existingBenifit.imageKey);
      }

      return this._createBenifitResponse(benifit);
    } catch (error) {
      if (imageKey) {
        await this._fileStorageService.queueDeleteFile(imageKey);
      }

      throw error;
    }
  }

  async deleteBenifit(id: string): Promise<BenifitResponse> {
    const benifit = await this.getBenifitDetails(id);

    this._ensureBenifitIsNotConnectedToPooja(benifit._count.poojas);

    const deletedBenifit = await this._prismaService.benefit.delete({
      where: { id },
      include: { translations: true },
    });

    if (deletedBenifit.imageKey) {
      await this._queueImageDelete(deletedBenifit.imageKey);
    }

    return this._createBenifitResponse(deletedBenifit);
  }

  private async _getBenifitImage(
    id: string,
  ): Promise<{ imageKey: string | null }> {
    const benifit = await this._prismaService.benefit.findUnique({
      where: { id },
      select: { imageKey: true },
    });

    if (!benifit) {
      throw new NotFoundException('Benifit not found');
    }

    return benifit;
  }

  private _ensureBenifitIsNotConnectedToPooja(poojaCount: number): void {
    if (poojaCount > 0) {
      throw new ConflictException(
        'Benifit cannot be deleted because it is connected to a pooja',
      );
    }
  }

  private async _createBenifitResponse<T extends { imageKey: string | null }>(
    benifit: T,
  ): Promise<T & { imageUrl: string | null }> {
    const imageUrl = await this._fileStorageService.createSecureUrl(
      benifit.imageKey,
    );

    return { ...benifit, imageUrl };
  }

  private async _queueImageDelete(imageKey: string): Promise<void> {
    await this._fileStorageService.queueDeleteFile(imageKey);
  }
}
