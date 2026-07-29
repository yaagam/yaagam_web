import { Module } from '@nestjs/common';
import { BenifitsController } from './benifits.controller';
import { ServicesService } from './services/services.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from 'src/common/gurads/guards.module';
import { BENIFIT_SERVICE } from './constants/service-tokens.const';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [BenifitsController],
  providers: [{ provide: BENIFIT_SERVICE, useClass: ServicesService }],
  exports: [BENIFIT_SERVICE],
})
export class BenifitsModule {}
