import { Module } from '@nestjs/common';
import { OfferingsModule } from '../../offerings/offerings.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsOfferingsController } from './ops-offerings.controller';

@Module({
  imports: [OfferingsModule, OpsAuthModule],
  controllers: [OpsOfferingsController],
})
export class OpsOfferingsModule {}
