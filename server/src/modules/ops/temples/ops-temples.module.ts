import { Module } from '@nestjs/common';
import { WebsiteCacheModule } from '../../../common/website-cache/website-cache.module';
import { TemplesModule } from '../../temples/temples.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsTemplesController } from './ops-temples.controller';

@Module({
  imports: [WebsiteCacheModule, TemplesModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsTemplesController],
})
export class OpsTemplesModule {}
