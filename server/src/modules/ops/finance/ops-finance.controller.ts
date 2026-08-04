import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { OperatorRole, PaymentStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TRANSACTION_QUERY_SERVICE } from '../../transactions/constants/payment.const';
import type { ITransactionQueryService } from '../../transactions/interfaces/transaction-query-service.interface';
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
  constructor(
    @Inject(TRANSACTION_QUERY_SERVICE)
    private readonly _transactionQueryService: ITransactionQueryService,
  ) {}

  @Get('transactions')
  async getTransactions(@Query() query: OpsFinanceTransactionsQueryDto) {
    return this._transactionQueryService.findTransactions(query);
  }
}
