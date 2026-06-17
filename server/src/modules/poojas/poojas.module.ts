import { Module } from '@nestjs/common';
import { PoojasController } from './poojas.controller';
import { ServicesService } from './services/services.service';
import { GuardsModule } from 'src/common/gurads/guards.module';

@Module({
  imports: [GuardsModule],
  controllers: [PoojasController],
  providers: [ServicesService],
})
export class PoojasModule {}
