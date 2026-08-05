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
import { BENIFIT_SERVICE } from '../../benifits/constants/service-tokens.const';
import { BenifitDetailsRequestDto } from '../../benifits/dtos/benifit-details.dto';
import { CreateBenifitDto } from '../../benifits/dtos/create-benifit.dto';
import { GetBenifitsQueryDto } from '../../benifits/dtos/get-benifits-query.dto';
import { UpdateBenifitDto } from '../../benifits/dtos/update-benifit.dto';
import type {
  BenifitDetailsResponse,
  BenifitResponse,
  IBenifitService,
  PaginatedBenifits,
} from '../../benifits/services/benifit.service.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('ops/benifits')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(OperatorRole.SUPER_ADMIN, OperatorRole.OPERATIONS)
export class OpsBenifitsController {
  constructor(
    @Inject(BENIFIT_SERVICE)
    private readonly _benifitService: IBenifitService,
  ) {}
  @Get() getBenifits(
    @Query() query: GetBenifitsQueryDto,
  ): Promise<PaginatedBenifits> {
    return this._benifitService.getBenifits(query);
  }
  @Get(':id') getBenifit(
    @Param() params: BenifitDetailsRequestDto,
  ): Promise<BenifitDetailsResponse> {
    return this._benifitService.getBenifitDetails(params.id!);
  }
  @Post() @UseInterceptors(FileInterceptor('image')) createBenifit(
    @Body() body: CreateBenifitDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    return this._benifitService.createBenifit(body, image);
  }
  @Patch(':id') @UseInterceptors(FileInterceptor('image')) updateBenifit(
    @Param() params: BenifitDetailsRequestDto,
    @Body() body: UpdateBenifitDto,
    @UploadedFile(ImageFileValidationPipe) image?: UploadedStorageFile,
  ): Promise<BenifitResponse> {
    return this._benifitService.updateBenifit(params.id!, body, image);
  }
  @Delete(':id') deleteBenifit(
    @Param() params: BenifitDetailsRequestDto,
  ): Promise<BenifitResponse> {
    return this._benifitService.deleteBenifit(params.id!);
  }
}
