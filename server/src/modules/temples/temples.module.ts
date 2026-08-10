import { Module } from '@nestjs/common';
import { TemplesController } from './temples.controller';
import { ServicesService } from './services/services.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from 'src/common/guards/guards.module';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';
import { ZohoModule } from '../../integrations/zoho/zoho.module';

@Module({
  imports: [PrismaModule, GuardsModule, ZohoModule],
  controllers: [TemplesController],
  providers: [{ provide: TEMPLE_SERVICE, useClass: ServicesService }],
  exports: [TEMPLE_SERVICE],
})
export class TemplesModule {}
