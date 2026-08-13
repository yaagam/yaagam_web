import { Module } from '@nestjs/common';
import { WebsiteCacheModule } from '../../../common/website-cache/website-cache.module';
import { PoojasModule } from '../../poojas/poojas.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsPoojasController } from './ops-poojas.controller';

@Module({
  imports: [WebsiteCacheModule, PoojasModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsPoojasController],
})
export class OpsPoojasModule {}
