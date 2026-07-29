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
import { OPS_MANAGEMENT_SERVICE } from '../management/ops-management.const';
import type {
  IOpsManagementService,
  PaginatedOpsSupportTickets,
  UpdatedOpsSupportTicketStatus,
} from '../management/ops-management.service.interface';
import { GetOpsSupportTicketsQueryDto } from '../../support/dto/get-ops-support-tickets-query.dto';
import { UpdateSupportTicketStatusDto } from '../../support/dto/update-support-ticket-status.dto';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';

@Controller('ops/support')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(OperatorRole.SUPER_ADMIN, OperatorRole.OPERATIONS, OperatorRole.SUPPORT)
export class OpsSupportController {
  constructor(
    @Inject(OPS_MANAGEMENT_SERVICE)
    private readonly _opsManagementService: IOpsManagementService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getSupportTickets(
    @Query() query: GetOpsSupportTicketsQueryDto,
  ): Promise<PaginatedOpsSupportTickets> {
    return this._opsManagementService.getSupportTickets(query);
  }

  @Patch(':id/status')
  async updateSupportTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<UpdatedOpsSupportTicketStatus> {
    const ticket = await this._opsManagementService.updateSupportTicketStatus(
      id,
      dto,
      operator.operatorId,
    );
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'SUPPORT_TICKET_STATUS_UPDATED',
      resource: 'SupportTicket',
      resourceId: ticket.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return ticket;
  }
}
