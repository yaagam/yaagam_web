import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { ADMIN_SERVICE } from './constants/service-tokens.const';
import { AdminService } from './services/admin.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [AdminController],
  providers: [{ provide: ADMIN_SERVICE, useClass: AdminService }],
})
export class AdminModule {}
