import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperatorRole, PaymentStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import PrismaService from '../../../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';

class OpsFinanceTransactionsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}

@Controller('ops/finance')
@UseGuards(OpsJwtAuthGuard, RoleGuard, PermissionGuard)
@Roles(OperatorRole.SUPER_ADMIN, OperatorRole.FINANCE)
export class OpsFinanceController {
  constructor(private readonly _prismaService: PrismaService) {}

  @Get('transactions')
  async getTransactions(@Query() query: OpsFinanceTransactionsQueryDto) {
    const where = query.status ? { status: query.status } : undefined;
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this._prismaService.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this._prismaService.transaction.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
