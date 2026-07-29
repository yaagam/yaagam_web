import { Module } from '@nestjs/common';
import { OpsManagementModule } from '../management/ops-management.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsSupportController } from './ops-support.controller';

@Module({
  imports: [OpsManagementModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsSupportController],
})
export class OpsSupportModule {}
