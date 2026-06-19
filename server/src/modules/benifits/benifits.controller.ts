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
import { UserRole } from '@prisma/client';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { Roles } from '../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';
import type { UploadedStorageFile } from '../../common/storage/interfaces/uploaded-storage-file.interface';
import { ImageFileValidationPipe } from '../../common/storage/pipes/image-file-validation.pipe';
import {
  BENIFIT_CREATED,
  BENIFIT_DELETED,
  BENIFIT_DETAILS_FETCHED,
  BENIFIT_FETCHED,
  BENIFIT_UPDATED,
} from './constants/success-message.const';
import { BENIFIT_SERVICE } from './constants/service-tokens.const';
import { BenifitDetailsRequestDto } from './dtos/benifit-details.dto';
import { CreateBenifitDto } from './dtos/create-benifit.dto';
import { GetBenifitsQueryDto } from './dtos/get-benifits-query.dto';
import { UpdateBenifitDto } from './dtos/update-benifit.dto';
import type {
  BenifitDetailsResponse,
  BenifitResponse,
  IBenifitService,
  PaginatedBenifits,
} from './services/benifit.service.interface';

@Controller('benifits')
export class BenifitsController {
  constructor(
    @Inject(BENIFIT_SERVICE)
    private readonly _benifitService: IBenifitService,
  ) {}

  @Get()
  @ResponseMessage(BENIFIT_FETCHED)
  getBenifits(@Query() query: GetBenifitsQueryDto): Promise<PaginatedBenifits> {
    return this._benifitService.getBenifits(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(BENIFIT_DETAILS_FETCHED)
  benifitDetails(
    @Param() params: BenifitDetailsRequestDto,
  ): Promise<BenifitDetailsResponse> {
    return this._benifitService.getBenifitDetails(params.id);
  }

  @Post()
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(BENIFIT_CREATED)
  createBenifit(
    @Body() body: CreateBenifitDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    return this._benifitService.createBenifit(body, image);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(BENIFIT_UPDATED)
  updateBenifit(
    @Param() params: BenifitDetailsRequestDto,
    @Body() body: UpdateBenifitDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    return this._benifitService.updateBenifit(params.id, body, image);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(BENIFIT_DELETED)
  deleteBenifit(
    @Param() params: BenifitDetailsRequestDto,
  ): Promise<BenifitResponse> {
    return this._benifitService.deleteBenifit(params.id);
  }
}
