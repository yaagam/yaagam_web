import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/guards/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import {
  BOOKING_LIFECYCLE_SERVICE,
  BOOKING_SERVICE,
  BOOKING_ZOHO_SYNC_SERVICE,
} from './constants/service-tokens.const';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingsService } from './services/bookings.service';
import { RazorpayModule } from '../../integrations/razorpay/razorpay.module';
import { ZohoModule } from '../../integrations/zoho/zoho.module';
import { BookingZohoSyncService } from './services/booking-zoho-sync.service';

@Module({
  imports: [GuardsModule, PrismaModule, RazorpayModule, ZohoModule],
  controllers: [BookingsController],
  providers: [
    { provide: BOOKING_SERVICE, useClass: BookingsService },
    {
      provide: BOOKING_LIFECYCLE_SERVICE,
      useClass: BookingLifecycleService,
    },
    {
      provide: BOOKING_ZOHO_SYNC_SERVICE,
      useClass: BookingZohoSyncService,
    },
  ],
  exports: [BOOKING_SERVICE, BOOKING_ZOHO_SYNC_SERVICE],
})
export class BookingsModule {}
