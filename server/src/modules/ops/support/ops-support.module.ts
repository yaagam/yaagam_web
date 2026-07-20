import { Module } from '@nestjs/common';
import { AdminModule } from '../../admin/admin.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsSupportController } from './ops-support.controller';

@Module({
  imports: [AdminModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsSupportController],
})
export class OpsSupportModule {}
