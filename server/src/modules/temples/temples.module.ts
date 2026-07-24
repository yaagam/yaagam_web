import { Module } from '@nestjs/common';
import { TemplesController } from './temples.controller';
import { ServicesService } from './services/services.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from 'src/common/gurads/guards.module';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [TemplesController],
  providers: [{ provide: TEMPLE_SERVICE, useClass: ServicesService }],
  exports: [TEMPLE_SERVICE],
})
export class TemplesModule {}
