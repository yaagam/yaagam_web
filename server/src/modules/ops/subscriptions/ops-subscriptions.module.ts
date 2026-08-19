import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OPS_SUBSCRIPTIONS_SERVICE } from './constants/service-tokens.const';
import { OpsSubscriptionsController } from './ops-subscriptions.controller';
import { OpsSubscriptionsService } from './ops-subscriptions.service';

@Module({
  imports: [PrismaModule, TransactionsModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsSubscriptionsController],
  providers: [
    {
      provide: OPS_SUBSCRIPTIONS_SERVICE,
      useClass: OpsSubscriptionsService,
    },
  ],
})
export class OpsSubscriptionsModule {}
