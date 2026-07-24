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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import { ImageFileValidationPipe } from '../../../common/storage/pipes/image-file-validation.pipe';
import type { UploadedStorageFile } from '../../../common/storage/interfaces/uploaded-storage-file.interface';
import { TEMPLE_SERVICE } from '../../temples/constants/service-tokens.const';
import { CreateTempleDto } from '../../temples/dtos/create-temple.dto';
import { GetTemplesQueryDto } from '../../temples/dtos/get-temples-query.dto';
import { TempleDetailsRequestDto } from '../../temples/dtos/temple-details.dto';
import { UpdateTempleDto } from '../../temples/dtos/update-temple.dto';
import type {
  ITempleService,
  PaginatedTemples,
  TempleDetailsResponse,
  TempleResponse,
} from '../../temples/services/temple.service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';

@Controller('ops/temples')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.TEMPLE_MANAGER,
)
export class OpsTemplesController {
  constructor(
    @Inject(TEMPLE_SERVICE)
    private readonly _templeService: ITempleService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getTemples(@Query() query: GetTemplesQueryDto): Promise<PaginatedTemples> {
    return this._templeService.getTemples(query);
  }

  @Get(':id')
  getTempleDetails(
    @Param() params: TempleDetailsRequestDto,
  ): Promise<TempleDetailsResponse> {
    return this._templeService.getTempleDetails(params.id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createTemple(
    @Body() body: CreateTempleDto,
    @UploadedFile(ImageFileValidationPipe)
    image: UploadedStorageFile | undefined,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<TempleResponse> {
    const temple = await this._templeService.createTemple(body, image);
    await this._log(operator, req, 'TEMPLE_CREATED', temple.id);
    return temple;
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateTemple(
    @Param() params: TempleDetailsRequestDto,
    @Body() body: UpdateTempleDto,
    @UploadedFile(ImageFileValidationPipe)
    image: UploadedStorageFile | undefined,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<TempleResponse> {
    const temple = await this._templeService.updateTemple(
      params.id,
      body,
      image,
    );
    await this._log(operator, req, 'TEMPLE_UPDATED', temple.id);
    return temple;
  }

  @Delete(':id')
  async deleteTemple(
    @Param() params: TempleDetailsRequestDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<TempleResponse> {
    const temple = await this._templeService.deleteTemple(params.id);
    await this._log(operator, req, 'TEMPLE_DELETED', temple.id);
    return temple;
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
      resource: 'Temple',
      resourceId,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
