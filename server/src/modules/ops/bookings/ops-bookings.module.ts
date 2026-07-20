import { Module } from '@nestjs/common';
import { AdminModule } from '../../admin/admin.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsBookingsController } from './ops-bookings.controller';

@Module({
  imports: [AdminModule, PrismaModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsBookingsController],
})
export class OpsBookingsModule {}
