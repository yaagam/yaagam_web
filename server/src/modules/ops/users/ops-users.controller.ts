import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import { OPS_MANAGEMENT_SERVICE } from '../management/ops-management.const';
import { GetOpsUsersQueryDto } from './get-ops-users-query.dto';
import type {
  IOpsManagementService,
  PaginatedOpsUsers,
} from '../management/ops-management.service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';
import { CreateOperatorDto } from './create-operator.dto';
import type {
  CreatedOperatorOutput,
  IOpsUsersService,
  OperatorListItem,
} from './ops-users.service.interface';
import { OPS_USERS_SERVICE } from './constants/service-tokens.const';

@Controller('ops/users')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
export class OpsUsersController {
  constructor(
    @Inject(OPS_MANAGEMENT_SERVICE)
    private readonly _opsManagementService: IOpsManagementService,
    @Inject(OPS_USERS_SERVICE)
    private readonly _opsUsersService: IOpsUsersService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  @Roles(
    OperatorRole.SUPER_ADMIN,
    OperatorRole.OPERATIONS,
    OperatorRole.SUPPORT,
  )
  getUsers(@Query() query: GetOpsUsersQueryDto): Promise<PaginatedOpsUsers> {
    return this._opsManagementService.getUsers(query);
  }

  @Get('operators')
  @Roles(OperatorRole.SUPER_ADMIN)
  getOperators(): Promise<OperatorListItem[]> {
    return this._opsUsersService.getOperators();
  }

  @Post('operators')
  @Roles(OperatorRole.SUPER_ADMIN)
  async createOperator(
    @Body() dto: CreateOperatorDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<CreatedOperatorOutput> {
    const createdOperator = await this._opsUsersService.createOperator(dto);
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'OPERATOR_CREATED',
      resource: 'Operator',
      resourceId: createdOperator.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    return createdOperator;
  }
}
