import { Module } from '@nestjs/common';
import { PoojasController } from './poojas.controller';
import { ServicesService } from './services/services.service';
import { GuardsModule } from 'src/common/gurads/guards.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { POOJA_SERVICE } from './constants/service-tokens.const';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [PoojasController],
  providers: [{ provide: POOJA_SERVICE, useClass: ServicesService }],
  exports: [POOJA_SERVICE],
})
export class PoojasModule {}
