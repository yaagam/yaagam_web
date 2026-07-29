import { Module } from '@nestjs/common';
import { OpsManagementModule } from '../management/ops-management.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsBookingsController } from './ops-bookings.controller';

@Module({
  imports: [OpsManagementModule, PrismaModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsBookingsController],
})
export class OpsBookingsModule {}
