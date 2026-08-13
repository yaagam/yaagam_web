import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OperatorRole } from '@prisma/client';
import { WEBSITE_CACHE_SERVICE } from '../../../common/website-cache/website-cache.constants';
import type { IWebsiteCacheService } from '../../../common/website-cache/website-cache.service.interface';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { ImageFileValidationPipe } from '../../../common/storage/pipes/image-file-validation.pipe';
import { OpsPrivateImageInterceptor } from '../common/ops-private-image.interceptor';
import { OFFERING_SERVICE } from '../../offerings/constants/service-tokens.const';
import { CreateOfferingDto } from '../../offerings/dto/create-offering.dto';
import { GetOfferingsQueryDto } from '../../offerings/dto/get-offerings-query.dto';
import { OfferingDetailsRequestDto } from '../../offerings/dto/offering-details.dto';
import { UpdateOfferingDto } from '../../offerings/dto/update-offering.dto';
import type { OpsOfferingResponse } from '../../offerings/entities/offering.entity';
import type {
  IOfferingService,
  PaginatedOpsOfferings,
} from '../../offerings/services/offering.service.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('ops/offerings')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@UseInterceptors(OpsPrivateImageInterceptor)
@Roles(OperatorRole.SUPER_ADMIN, OperatorRole.OPERATIONS)
export class OpsOfferingsController {
  constructor(
    @Inject(OFFERING_SERVICE)
    private readonly _offeringService: IOfferingService,
    @Inject(WEBSITE_CACHE_SERVICE)
    private readonly _websiteCacheService: IWebsiteCacheService,
  ) {}

  @Get()
  getOfferings(
    @Query() query: GetOfferingsQueryDto,
  ): Promise<PaginatedOpsOfferings> {
    return this._offeringService.getOpsOfferings(query);
  }

  @Get(':id')
  getOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.getOfferingDetails(params.id!);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createOffering(
    @Body() body: CreateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    const offering = await this._offeringService.createOffering(body, image);
    await this._websiteCacheService.invalidate('offering', offering.slug);
    return offering;
  }

  @Post(':id/sync-zoho')
  syncOfferingWithZoho(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.syncOfferingWithZoho(params.id!);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateOffering(
    @Param() params: OfferingDetailsRequestDto,
    @Body() body: UpdateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    const previous = await this._offeringService.getOfferingDetails(params.id!);
    const offering = await this._offeringService.updateOffering(params.id!, body, image);
    await this._websiteCacheService.invalidate(
      'offering',
      previous.slug,
      offering.slug,
    );
    return offering;
  }

  @Delete(':id')
  async deleteOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OpsOfferingResponse> {
    const offering = await this._offeringService.deleteOffering(params.id!);
    await this._websiteCacheService.invalidate('offering', offering.slug);
    return offering;
  }
}
