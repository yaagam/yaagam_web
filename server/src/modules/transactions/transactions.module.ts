import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsController } from './payments.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [BookingsModule, GuardsModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
