import { Global, Module } from '@nestjs/common';
import { GuardsModule } from '../gurads/guards.module';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';

@Global()
@Module({
  imports: [GuardsModule],
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
