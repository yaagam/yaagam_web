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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import { ImageFileValidationPipe } from '../../../common/storage/pipes/image-file-validation.pipe';
import { OpsPrivateImageInterceptor } from '../common/ops-private-image.interceptor';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { POOJA_SERVICE } from '../../poojas/constants/service-tokens.const';
import { CreatePoojaDto } from '../../poojas/dtos/create-pooja.dto';
import { GetPoojasQueryDto } from '../../poojas/dtos/get-poojas-query.dto';
import { PoojaDetailsRequestDto } from '../../poojas/dtos/pooja-details.dto';
import { UpdatePoojaDto } from '../../poojas/dtos/update-pooja.dto';
import type {
  IPoojaService,
  OpsPoojaDetailsResponse,
  OpsPoojaResponse,
  PaginatedPoojas,
  PoojaResponse,
} from '../../poojas/services/pooja.service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';

@Controller('ops/poojas')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@UseInterceptors(OpsPrivateImageInterceptor)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.TEMPLE_MANAGER,
)
export class OpsPoojasController {
  constructor(
    @Inject(POOJA_SERVICE)
    private readonly _poojaService: IPoojaService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getPoojas(@Query() query: GetPoojasQueryDto): Promise<PaginatedPoojas> {
    return this._poojaService.getOpsPoojas(query);
  }

  @Get(':id')
  getPoojaDetails(
    @Param() params: PoojaDetailsRequestDto,
  ): Promise<OpsPoojaDetailsResponse> {
    return this._poojaService.getPoojaDetails(params.id!);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 4))
  async createPooja(
    @Body() body: CreatePoojaDto,
    @UploadedFiles(ImageFileValidationPipe)
    images: UploadedStorageFile[] | undefined,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<OpsPoojaResponse> {
    const pooja = await this._poojaService.createPooja(body, images);
    await this._log(operator, req, 'POOJA_CREATED', pooja.id);
    return pooja;
  }

  @Post(':id/sync-zoho')
  async syncPoojaWithZoho(
    @Param() params: PoojaDetailsRequestDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<OpsPoojaDetailsResponse> {
    const pooja = await this._poojaService.syncPoojaWithZoho(params.id!);
    await this._log(operator, req, 'POOJA_ZOHO_SYNC_RETRIED', pooja.id);
    return pooja;
  }
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 4))
  async updatePooja(
    @Param() params: PoojaDetailsRequestDto,
    @Body() body: UpdatePoojaDto,
    @UploadedFiles(ImageFileValidationPipe)
    images: UploadedStorageFile[] | undefined,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<PoojaResponse> {
    const pooja = await this._poojaService.updatePooja(
      params.id!,
      body,
      images,
    );
    await this._log(operator, req, 'POOJA_UPDATED', pooja.id);
    return pooja;
  }

  @Delete(':id')
  async deletePooja(
    @Param() params: PoojaDetailsRequestDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<PoojaResponse> {
    const pooja = await this._poojaService.deletePooja(params.id!);
    await this._log(operator, req, 'POOJA_DELETED', pooja.id);
    return pooja;
  }

  private _log(
    operator: OpsRequestOperator,
    req: Request,
    action: string,
    resourceId: string,
  ): Promise<void> {
    return this._auditService.log({
      operatorId: operator.operatorId,
      action,
      resource: 'Pooja',
      resourceId,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
