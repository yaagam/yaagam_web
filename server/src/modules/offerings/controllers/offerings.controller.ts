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
import { ResponseMessage } from '../../../common/decarators/success-message.decarator';
import { Roles } from '../../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../../common/gurads/role.guard';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { ImageFileValidationPipe } from '../../../common/storage/pipes/image-file-validation.pipe';
import {
  OFFERING_CREATED,
  OFFERING_DELETED,
  OFFERING_DETAILS_FETCHED,
  OFFERING_UPDATED,
  OFFERINGS_FETCHED,
} from '../constants/success-message.const';
import { OFFERING_SERVICE } from '../constants/service-tokens.const';
import { CreateOfferingDto } from '../dto/create-offering.dto';
import { GetOfferingsQueryDto } from '../dto/get-offerings-query.dto';
import { OfferingDetailsRequestDto } from '../dto/offering-details.dto';
import { UpdateOfferingDto } from '../dto/update-offering.dto';
import type { OfferingResponse } from '../entities/offering.entity';
import type {
  IOfferingService,
  PaginatedOfferings,
} from '../services/offering.service.interface';

@Controller('offerings')
export class OfferingsController {
  constructor(
    @Inject(OFFERING_SERVICE)
    private readonly _offeringService: IOfferingService,
  ) {}

  @Get()
  @ResponseMessage(OFFERINGS_FETCHED)
  getOfferings(
    @Query() query: GetOfferingsQueryDto,
  ): Promise<PaginatedOfferings> {
    return this._offeringService.getOfferings(query);
  }

  @Get(':id')
  @ResponseMessage(OFFERING_DETAILS_FETCHED)
  getOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OfferingResponse> {
    return this._offeringService.getOfferingDetails(params.id);
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(OFFERING_CREATED)
  createOffering(
    @Body() body: CreateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OfferingResponse> {
    return this._offeringService.createOffering(body, image);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(OFFERING_UPDATED)
  updateOffering(
    @Param() params: OfferingDetailsRequestDto,
    @Body() body: UpdateOfferingDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<OfferingResponse> {
    return this._offeringService.updateOffering(params.id, body, image);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(OFFERING_DELETED)
  deleteOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OfferingResponse> {
    return this._offeringService.deleteOffering(params.id);
  }
}
