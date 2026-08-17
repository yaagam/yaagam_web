import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/guards/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
})
export class PrivacyModule {}
