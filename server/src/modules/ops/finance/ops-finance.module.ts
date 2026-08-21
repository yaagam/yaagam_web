import { Module } from '@nestjs/common';
import { TransactionsModule } from '../../transactions/transactions.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsFinanceController } from './ops-finance.controller';

@Module({
  imports: [TransactionsModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsFinanceController],
})
export class OpsFinanceModule {}
