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
  createOffering(
    @Body() body: CreateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.createOffering(body, image);
  }

  @Post(':id/sync-zoho')
  syncOfferingWithZoho(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.syncOfferingWithZoho(params.id!);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  updateOffering(
    @Param() params: OfferingDetailsRequestDto,
    @Body() body: UpdateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.updateOffering(params.id!, body, image);
  }

  @Delete(':id')
  deleteOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OpsOfferingResponse> {
    return this._offeringService.deleteOffering(params.id!);
  }
}
