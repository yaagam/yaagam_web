import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import {
  BOOKING_LIFECYCLE_SERVICE,
  BOOKING_SERVICE,
} from './constants/service-tokens.const';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingsService } from './services/bookings.service';
import { RazorpayClientService } from './services/razorpay-client.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [BookingsController],
  providers: [
    { provide: BOOKING_SERVICE, useClass: BookingsService },
    {
      provide: BOOKING_LIFECYCLE_SERVICE,
      useClass: BookingLifecycleService,
    },
    RazorpayClientService,
  ],
  exports: [BOOKING_SERVICE, RazorpayClientService],
})
export class BookingsModule {}
