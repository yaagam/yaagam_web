import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('v1/ops/dashboard')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(
  OperatorRole.SUPER_ADMIN,
  OperatorRole.OPERATIONS,
  OperatorRole.FINANCE,
  OperatorRole.TEMPLE_MANAGER,
  OperatorRole.SUPPORT,
)
export class OpsDashboardController {
  constructor(private readonly _prismaService: PrismaService) {}

  @Get('summary')
  async getSummary() {
    const [users, bookings, temples, poojas, openSupportTickets] =
      await Promise.all([
        this._prismaService.user.count(),
        this._prismaService.booking.count(),
        this._prismaService.temple.count(),
        this._prismaService.pooja.count(),
        this._prismaService.supportTicket.count({
          where: { status: { not: 'RESOLVED' } },
        }),
      ]);

    return { users, bookings, temples, poojas, openSupportTickets };
  }
}
