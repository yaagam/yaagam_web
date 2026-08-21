import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperatorRole, PaymentStatus } from '@prisma/client';
import type { Request } from 'express';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  SETTLEMENT_PROCESSING_SERVICE,
  TRANSACTION_QUERY_SERVICE,
} from '../../transactions/constants/payment.const';
import type { ISettlementProcessingService } from '../../transactions/interfaces/settlement-processing-service.interface';
import type { ITransactionQueryService } from '../../transactions/interfaces/transaction-query-service.interface';
import { OPS_AUDIT_SERVICE } from '../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../audit/interfaces/ops-audit.service.interface';
import { CurrentOperator } from '../auth/decorators/current-operator.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsJwtAuthGuard } from '../auth/guards/ops-jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import type { OpsRequestOperator } from '../auth/interfaces/ops-authenticated-request.interface';
import { GetOpsSettlementsQueryDto } from './get-ops-settlements-query.dto';
import {
  BackfillSettlementsDto,
  RecoverSettlementDto,
} from './settlement-recovery.dto';

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
    @Inject(SETTLEMENT_PROCESSING_SERVICE)
    private readonly _settlementProcessingService: ISettlementProcessingService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  @Get('transactions')
  async getTransactions(@Query() query: OpsFinanceTransactionsQueryDto) {
    return this._transactionQueryService.findTransactions(query);
  }

  @Get('settlements')
  getSettlements(@Query() query: GetOpsSettlementsQueryDto) {
    return this._settlementProcessingService.findAll(query);
  }

  @Post('settlements/:id/retry')
  async retrySettlement(
    @Param('id') id: string,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ) {
    const settlement = await this._settlementProcessingService.retry(id);
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'SETTLEMENT_RECONCILIATION_RETRIED',
      resource: 'RazorpaySettlement',
      resourceId: settlement.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return settlement;
  }

  @Post('settlements/recover')
  async recoverSettlement(
    @Body() dto: RecoverSettlementDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ) {
    const settlement = await this._settlementProcessingService.recover(
      dto.providerSettlementId,
    );
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'SETTLEMENT_RECOVERED_FROM_RAZORPAY',
      resource: 'RazorpaySettlement',
      resourceId: settlement.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return settlement;
  }

  @Post('settlements/backfill')
  async backfillSettlements(
    @Body() dto: BackfillSettlementsDto,
    @CurrentOperator() operator: OpsRequestOperator,
    @Req() req: Request,
  ) {
    const result = await this._settlementProcessingService.requestBackfill(
      dto.days,
    );
    await this._auditService.log({
      operatorId: operator.operatorId,
      action: 'SETTLEMENT_BACKFILL_REQUESTED',
      resource: 'RazorpaySettlement',
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return result;
  }
}
