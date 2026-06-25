import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import { BOOKING_SERVICE } from './constants/service-tokens.const';
import { BookingsService } from './services/bookings.service';
import { RazorpayClientService } from './services/razorpay-client.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [BookingsController],
  providers: [
    { provide: BOOKING_SERVICE, useClass: BookingsService },
    RazorpayClientService,
  ],
  exports: [BOOKING_SERVICE, RazorpayClientService],
})
export class BookingsModule {}
