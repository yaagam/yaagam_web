import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminModule } from '../../admin/admin.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OPS_USERS_SERVICE } from './ops-users.controller';
import { OpsUsersController } from './ops-users.controller';
import { OpsUsersService } from './ops-users.service';

@Module({
  imports: [AdminModule, PrismaModule, OpsAuthModule, OpsAuditModule],
  controllers: [OpsUsersController],
  providers: [{ provide: OPS_USERS_SERVICE, useClass: OpsUsersService }],
})
export class OpsUsersModule {}
