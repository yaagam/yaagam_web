import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import { TranslateJsonDto } from '../../common/translation/dtos/translate-json.dto';
import type { TranslationResult } from '../../common/translation/interfaces/translation-result.interface';
import { TranslationService } from '../../common/translation/translation.service';
import { Roles } from './auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from './auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from './auth/guards/permission.guard';
import { RoleGuard } from './auth/guards/role.guard';

@Controller('ops/translations')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(OperatorRole.SUPER_ADMIN, OperatorRole.OPERATIONS, OperatorRole.TEMPLE_MANAGER)
export class OpsTranslationsController {
  constructor(private readonly _translationService: TranslationService) {}

  @Post()
  translate(@Body() body: TranslateJsonDto): Promise<TranslationResult> {
    return this._translationService.translateJson(body);
  }
}