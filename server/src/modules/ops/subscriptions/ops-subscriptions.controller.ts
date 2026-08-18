import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';
import { OPS_SUBSCRIPTIONS_SERVICE } from './constants/service-tokens.const';
import { GetOpsSubscriptionsQueryDto } from './get-ops-subscriptions-query.dto';
import type {
  IOpsSubscriptionsService,
  PaginatedOpsSubscriptions,
} from './ops-subscriptions.service.interface';
import { UpdateOpsSubscriptionDto } from './update-ops-subscription.dto';

@Controller('ops/subscriptions')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.FINANCE,
  OperatorRole.SUPPORT,
)
export class OpsSubscriptionsController {
  constructor(
    @Inject(OPS_SUBSCRIPTIONS_SERVICE)
    private readonly _subscriptionsService: IOpsSubscriptionsService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getSubscriptions(
    @Query() query: GetOpsSubscriptionsQueryDto,
  ): Promise<PaginatedOpsSubscriptions> {
    return this._subscriptionsService.getSubscriptions(query);
  }

  @Get(':id')
  getSubscription(@Param('id') id: string) {
    return this._subscriptionsService.getSubscription(id);
  }

  @Patch(':id')
  @Roles(
    OperatorRole.SUPER_ADMIN,
    OperatorRole.OPERATIONS,
    OperatorRole.FINANCE,
  )
  async changeSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateOpsSubscriptionDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() request: Request,
  ) {
    const subscription = await this._subscriptionsService.changeSubscription(
      id,
      dto.action,
    );
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: `SUBSCRIPTION_${dto.action.toUpperCase()}`,
      resource: 'PaymentSubscription',
      resourceId: subscription.id,
      ip: request.ip,
      userAgent: request.get('user-agent') ?? undefined,
    });
    return subscription;
  }
}
