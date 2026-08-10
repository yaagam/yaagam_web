import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OPS_AUDIT_SERVICE } from './constants/service-tokens.const';
import { OpsAuditService } from './services/ops-audit.service';
import { OpsAuditRetentionService } from './services/ops-audit-retention.service';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: OPS_AUDIT_SERVICE, useClass: OpsAuditService },
    OpsAuditRetentionService,
  ],
  exports: [OPS_AUDIT_SERVICE],
})
export class OpsAuditModule {}
