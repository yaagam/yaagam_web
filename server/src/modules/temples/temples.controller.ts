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
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import {
  TEMPLE_CREATED,
  TEMPLE_DELETED,
  TEMPLE_DETAILS_FETCHED,
  TEMPLE_FETCHED,
  TEMPLE_UPDATED,
} from './constants/success-message.const';
import { Roles } from '../../common/decarators/role.decarator';
import { UserRole } from '@prisma/client';
import { RoleGuard } from '../../common/gurads/role.guard';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';
import { GetTemplesQueryDto } from './dtos/get-temples-query.dto';
import type {
  ITempleService,
  PaginatedTemples,
  TempleDetailsResponse,
  TempleResponse,
} from './services/temple.service.interface';
import { TempleDetailsRequestDto } from './dtos/temple-details.dto';
import { CreateTempleDto } from './dtos/create-temple.dto';
import { UpdateTempleDto } from './dtos/update-temple.dto';
import type { UploadedStorageFile } from '../../common/storage/interfaces/uploaded-storage-file.interface';
import { ImageFileValidationPipe } from '../../common/storage/pipes/image-file-validation.pipe';

@Controller('temples')
export class TemplesController {
  constructor(
    @Inject(TEMPLE_SERVICE)
    private readonly _templeService: ITempleService,
  ) {}

  @Get()
  @ResponseMessage(TEMPLE_FETCHED)
  getTemples(@Query() query: GetTemplesQueryDto): Promise<PaginatedTemples> {
    return this._templeService.getTemples(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @ResponseMessage(TEMPLE_DETAILS_FETCHED)
  templeDetails(
    @Param() params: TempleDetailsRequestDto,
  ): Promise<TempleDetailsResponse> {
    return this._templeService.getTempleDetails(params.id);
  }

  @Post()
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(TEMPLE_CREATED)
  createTemple(
    @Body() body: CreateTempleDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<TempleResponse> {
    return this._templeService.createTemple(body, image);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage(TEMPLE_UPDATED)
  updateTemple(
    @Param() params: TempleDetailsRequestDto,
    @Body() body: UpdateTempleDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<TempleResponse> {
    return this._templeService.updateTemple(params.id, body, image);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN.toLowerCase())
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(TEMPLE_DELETED)
  deleteTemple(
    @Param() params: TempleDetailsRequestDto,
  ): Promise<TempleResponse> {
    return this._templeService.deleteTemple(params.id);
  }
}
