import { Module } from '@nestjs/common';
import { PoojasModule } from '../../poojas/poojas.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsPoojasController } from './ops-poojas.controller';

@Module({
  imports: [PoojasModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsPoojasController],
})
export class OpsPoojasModule {}
