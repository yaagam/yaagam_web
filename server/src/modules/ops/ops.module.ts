import { Module } from '@nestjs/common';
import { OpsAuditModule } from './audit/ops-audit.module';
import { OpsAuthModule } from './auth/ops-auth.module';
import { OpsBookingsModule } from './bookings/ops-bookings.module';
import { OpsDashboardModule } from './dashboard/ops-dashboard.module';
import { OpsFinanceModule } from './finance/ops-finance.module';
import { OpsPoojasModule } from './poojas/ops-poojas.module';
import { OpsSettingsModule } from './settings/ops-settings.module';
import { OpsSupportModule } from './support/ops-support.module';
import { OpsTemplesModule } from './temples/ops-temples.module';
import { OpsUsersModule } from './users/ops-users.module';

@Module({
  imports: [
    OpsAuditModule,
    OpsAuthModule,
    OpsDashboardModule,
    OpsUsersModule,
    OpsBookingsModule,
    OpsTemplesModule,
    OpsPoojasModule,
    OpsFinanceModule,
    OpsSettingsModule,
    OpsSupportModule,
  ],
})
export class OpsModule {}
