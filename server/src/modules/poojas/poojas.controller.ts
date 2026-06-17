import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decarators/role.decarator';
import { RoleGuard } from 'src/common/gurads/role.guard';

@Controller('poojas')
export class PoojasController {
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RoleGuard)
  getPoojas() {}
}
