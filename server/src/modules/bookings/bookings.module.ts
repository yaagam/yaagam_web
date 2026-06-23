import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './services/bookings.service';
import { RazorpayClientService } from './services/razorpay-client.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [BookingsController],
  providers: [BookingsService, RazorpayClientService],
  exports: [RazorpayClientService],
})
export class BookingsModule {}
