import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingStatus, OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import { OPS_MANAGEMENT_SERVICE } from '../management/ops-management.const';
import { GetOpsBookingsQueryDto } from './get-ops-bookings-query.dto';
import type {
  IOpsManagementService,
  PaginatedOpsBookings,
} from '../management/ops-management.service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';
import { UpdateOpsBookingStatusDto } from './update-ops-booking-status.dto';

@Controller('ops/bookings')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.SUPPORT,
  OperatorRole.FINANCE,
)
export class OpsBookingsController {
  constructor(
    @Inject(OPS_MANAGEMENT_SERVICE)
    private readonly _opsManagementService: IOpsManagementService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getBookings(
    @Query() query: GetOpsBookingsQueryDto,
  ): Promise<PaginatedOpsBookings> {
    return this._opsManagementService.getBookings(query);
  }

  @Get('filter-options')
  getBookingFilterOptions() {
    return this._opsManagementService.getBookingFilterOptions();
  }

  @Get(':id')
  getBooking(@Param('id') id: string) {
    return this._opsManagementService.getBooking(id);
  }
  @Patch(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpsBookingStatusDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<{ id: string; status: BookingStatus; updatedAt: Date }> {
    const booking = await this._opsManagementService.updateBookingStatus(
      id,
      dto.status,
    );

    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'BOOKING_STATUS_UPDATED',
      resource: 'Booking',
      resourceId: booking.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    return booking;
  }

  @Post(':id/zoho/retry')
  @Roles(
    OperatorRole.SUPER_ADMIN,
    OperatorRole.OPERATIONS,
    OperatorRole.FINANCE,
  )
  async retryZohoSync(
    @Param('id') id: string,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ) {
    const booking = await this._opsManagementService.retryBookingZohoSync(id);
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'BOOKING_ZOHO_SYNC_RETRIED',
      resource: 'Booking',
      resourceId: booking.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return booking;
  }
}
