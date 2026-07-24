import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsDashboardController } from './ops-dashboard.controller';

@Module({
  imports: [PrismaModule, OpsAuthModule],
  controllers: [OpsDashboardController],
})
export class OpsDashboardModule {}
