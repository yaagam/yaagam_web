import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decarators/success-message.decarator';
import { TEMPLE_FETCHED } from './constants/success-message.const';
import { Roles } from 'src/common/decarators/role.decarator';
import { UserRole } from '@prisma/client';
import { RoleGuard } from 'src/common/gurads/role.guard';
import { JwtAuthGuard } from 'src/common/gurads/jwt-auth.guard';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';
import { GetTemplesQueryDto } from './dtos/get-temples-query.dto';
import type {
  ITempleService,
  PaginatedTemples,
} from './services/temple.service.interface';

@Controller('temples')
export class TemplesController {
  constructor(
    @Inject(TEMPLE_SERVICE)
    private readonly _templeService: ITempleService,
  ) {}

  @Get()
  // @Roles(UserRole.ADMIN)
  // @UseGuards(JwtAuthGuard, RoleGuard)
  @ResponseMessage(TEMPLE_FETCHED)
  getTemples(@Query() query: GetTemplesQueryDto): Promise<PaginatedTemples> {
    return this._templeService.getTemples(query);
  }
}
