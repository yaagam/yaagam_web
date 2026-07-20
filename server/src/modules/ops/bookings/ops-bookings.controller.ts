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
import { BookingStatus, OperatorRole } from '@prisma/client';
import type { Request } from 'express';
import PrismaService from '../../../prisma/prisma.service';
import { ADMIN_SERVICE } from '../../admin/constants/service-tokens.const';
import { GetAdminBookingsQueryDto } from '../../admin/dtos/get-admin-bookings-query.dto';
import type {
  IAdminService,
  PaginatedAdminBookings,
} from '../../admin/services/admin.service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';
import { UpdateOpsBookingStatusDto } from './update-ops-booking-status.dto';

@Controller('v1/ops/bookings')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.SUPPORT,
  OperatorRole.FINANCE,
)
export class OpsBookingsController {
  constructor(
    @Inject(ADMIN_SERVICE)
    private readonly _adminService: IAdminService,
    private readonly _prismaService: PrismaService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get()
  getBookings(
    @Query() query: GetAdminBookingsQueryDto,
  ): Promise<PaginatedAdminBookings> {
    return this._adminService.getBookings(query);
  }

  @Patch(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpsBookingStatusDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ): Promise<{ id: string; status: BookingStatus; updatedAt: Date }> {
    const booking = await this._prismaService.booking.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true, updatedAt: true },
    });

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
}
