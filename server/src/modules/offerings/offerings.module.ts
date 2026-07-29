import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  OFFERING_REPOSITORY,
  OFFERING_SERVICE,
} from './constants/service-tokens.const';
import { OfferingsController } from './controllers/offerings.controller';
import { PrismaOfferingRepository } from './repositories/prisma-offering.repository';
import { OfferingsService } from './services/offerings.service';
import { DiscountPriceValidator } from './validators/discount-price.validator';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [OfferingsController],
  providers: [
    DiscountPriceValidator,
    { provide: OFFERING_REPOSITORY, useClass: PrismaOfferingRepository },
    { provide: OFFERING_SERVICE, useClass: OfferingsService },
  ],
  exports: [OFFERING_SERVICE],
})
export class OfferingsModule {}
