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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { Roles } from '../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';
import {
  ADMIN_SUPPORT_TICKETS_FETCHED,
  ADMIN_SUPPORT_TICKET_STATUS_UPDATED,
} from '../support/constants/success-message.const';
import { GetAdminSupportTicketsQueryDto } from '../support/dto/get-admin-support-tickets-query.dto';
import { UpdateSupportTicketStatusDto } from '../support/dto/update-support-ticket-status.dto';
import {
  ADMIN_BOOKINGS_FETCHED,
  ADMIN_USERS_FETCHED,
} from './constants/success-message.const';
import { ADMIN_SERVICE } from './constants/service-tokens.const';
import { GetAdminBookingsQueryDto } from './dtos/get-admin-bookings-query.dto';
import { GetAdminUsersQueryDto } from './dtos/get-admin-users-query.dto';
import type {
  IAdminService,
  PaginatedAdminBookings,
  PaginatedAdminSupportTickets,
  PaginatedAdminUsers,
  UpdatedAdminSupportTicketStatus,
} from './services/admin.service.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(UserRole.ADMIN.toLowerCase(), 'super-admin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AdminController {
  constructor(
    @Inject(ADMIN_SERVICE)
    private readonly _adminService: IAdminService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'List users for admin' })
  @ResponseMessage(ADMIN_USERS_FETCHED)
  getUsers(
    @Query() query: GetAdminUsersQueryDto,
  ): Promise<PaginatedAdminUsers> {
    return this._adminService.getUsers(query);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List bookings for admin' })
  @ResponseMessage(ADMIN_BOOKINGS_FETCHED)
  getBookings(
    @Query() query: GetAdminBookingsQueryDto,
  ): Promise<PaginatedAdminBookings> {
    return this._adminService.getBookings(query);
  }

  @Get('support')
  @ApiOperation({ summary: 'List support tickets for admin' })
  @ApiOkResponse({ description: 'Paginated support tickets' })
  @ResponseMessage(ADMIN_SUPPORT_TICKETS_FETCHED)
  getSupportTickets(
    @Query() query: GetAdminSupportTicketsQueryDto,
  ): Promise<PaginatedAdminSupportTickets> {
    return this._adminService.getSupportTickets(query);
  }

  @Patch('support/:id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  @ApiParam({ name: 'id', example: 'support-ticket-id' })
  @ApiOkResponse({ description: 'Updated support ticket status' })
  @ResponseMessage(ADMIN_SUPPORT_TICKET_STATUS_UPDATED)
  updateSupportTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UpdatedAdminSupportTicketStatus> {
    return this._adminService.updateSupportTicketStatus(
      id,
      dto,
      req.user?.userId,
    );
  }
}
