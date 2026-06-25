import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { Roles } from '../../common/decarators/role.decarator';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';
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
  PaginatedAdminUsers,
} from './services/admin.service.interface';

@Controller('admin')
@Roles(UserRole.ADMIN.toLowerCase(), 'super-admin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AdminController {
  constructor(
    @Inject(ADMIN_SERVICE)
    private readonly _adminService: IAdminService,
  ) {}

  @Get('users')
  @ResponseMessage(ADMIN_USERS_FETCHED)
  getUsers(
    @Query() query: GetAdminUsersQueryDto,
  ): Promise<PaginatedAdminUsers> {
    return this._adminService.getUsers(query);
  }

  @Get('bookings')
  @ResponseMessage(ADMIN_BOOKINGS_FETCHED)
  getBookings(
    @Query() query: GetAdminBookingsQueryDto,
  ): Promise<PaginatedAdminBookings> {
    return this._adminService.getBookings(query);
  }
}
