import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsFinanceController } from './ops-finance.controller';

@Module({
  imports: [PrismaModule, OpsAuthModule],
  controllers: [OpsFinanceController],
})
export class OpsFinanceModule {}
