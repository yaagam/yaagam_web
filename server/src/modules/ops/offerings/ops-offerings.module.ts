import { Module } from '@nestjs/common';
import { WebsiteCacheModule } from '../../../common/website-cache/website-cache.module';
import { OfferingsModule } from '../../offerings/offerings.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsOfferingsController } from './ops-offerings.controller';

@Module({
  imports: [WebsiteCacheModule, OfferingsModule, OpsAuthModule],
  controllers: [OpsOfferingsController],
})
export class OpsOfferingsModule {}
