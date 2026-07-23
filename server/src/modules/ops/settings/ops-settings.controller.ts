import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('ops/settings')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(OperatorRole.SUPER_ADMIN)
export class OpsSettingsController {
  @Get()
  getSettings() {
    return { editable: false };
  }
}
