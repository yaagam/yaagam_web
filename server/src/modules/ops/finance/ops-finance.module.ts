import { Module } from '@nestjs/common';
import { TransactionsModule } from '../../transactions/transactions.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsFinanceController } from './ops-finance.controller';

@Module({
  imports: [TransactionsModule, OpsAuthModule],
  controllers: [OpsFinanceController],
})
export class OpsFinanceModule {}
