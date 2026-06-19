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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { Roles } from '../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';
import type { UploadedStorageFile } from '../../common/storage/interfaces/uploaded-storage-file.interface';
import { ImageFileValidationPipe } from '../../common/storage/pipes/image-file-validation.pipe';
import {
  POOJA_CREATED,
  POOJA_DELETED,
  POOJA_DETAILS_FETCHED,
  POOJA_FETCHED,
  POOJA_UPDATED,
} from './constants/success-message.const';
import { POOJA_SERVICE } from './constants/service-tokens.const';
import { CreatePoojaDto } from './dtos/create-pooja.dto';
import { GetPoojasQueryDto } from './dtos/get-poojas-query.dto';
import { PoojaDetailsRequestDto } from './dtos/pooja-details.dto';
import { UpdatePoojaDto } from './dtos/update-pooja.dto';
import type {
  IPoojaService,
  PaginatedPoojas,
  PoojaDetailsResponse,
  PoojaResponse,
} from './services/pooja.service.interface';

@Controller('poojas')
export class PoojasController {
  constructor(
    @Inject(POOJA_SERVICE)
    private readonly _poojaService: IPoojaService,
  ) {}

  @Get()
  @ResponseMessage(POOJA_FETCHED)
  getPoojas(@Query() query: GetPoojasQueryDto): Promise<PaginatedPoojas> {
    return this._poojaService.getPoojas(query);
  }

  @Get(':id')
  @ResponseMessage(POOJA_DETAILS_FETCHED)
  poojaDetails(
    @Param() params: PoojaDetailsRequestDto,
  ): Promise<PoojaDetailsResponse> {
    return this._poojaService.getPoojaDetails(params.id);
  }

  @Post()
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FilesInterceptor('images', 4))
  @ResponseMessage(POOJA_CREATED)
  createPooja(
    @Body() body: CreatePoojaDto,
    @UploadedFiles(ImageFileValidationPipe) images?: UploadedStorageFile[],
  ): Promise<PoojaResponse> {
    return this._poojaService.createPooja(body, images);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FilesInterceptor('images', 4))
  @ResponseMessage(POOJA_UPDATED)
  updatePooja(
    @Param() params: PoojaDetailsRequestDto,
    @Body() body: UpdatePoojaDto,
    @UploadedFiles(ImageFileValidationPipe) images?: UploadedStorageFile[],
  ): Promise<PoojaResponse> {
    return this._poojaService.updatePooja(params.id, body, images);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(POOJA_DELETED)
  deletePooja(@Param() params: PoojaDetailsRequestDto): Promise<PoojaResponse> {
    return this._poojaService.deletePooja(params.id);
  }
}
