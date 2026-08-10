import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsManagementModule } from '../management/ops-management.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OPS_USERS_SERVICE } from './constants/service-tokens.const';
import { OpsUsersController } from './ops-users.controller';
import { OpsUsersService } from './ops-users.service';

@Module({
  imports: [OpsManagementModule, PrismaModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsUsersController],
  providers: [{ provide: OPS_USERS_SERVICE, useClass: OpsUsersService }],
})
export class OpsUsersModule {}
