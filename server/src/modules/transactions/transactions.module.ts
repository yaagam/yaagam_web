import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/guards/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RazorpayModule } from '../../integrations/razorpay/razorpay.module';
import { ZohoModule } from '../../integrations/zoho/zoho.module';
import { RAZORPAY_CLIENT } from '../../integrations/razorpay/constants/razorpay-service-token.const';
import { BookingsModule } from '../bookings/bookings.module';
import { AuthModule } from '../auth/auth.module';
import { AutopayReminderService } from './services/autopay-reminder.service';
import {
  PAYMENT_BOOKING_LIFECYCLE_SERVICE,
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  PAYMENT_RECONCILIATION_SERVICE,
  PAYMENT_SESSION_SERVICE,
  PAYMENT_SERVICE,
  PAYMENT_WEBHOOK_SERVICE,
  TRANSACTION_QUERY_SERVICE,
  SETTLEMENT_PROCESSING_SERVICE,
} from './constants/payment.const';
import {
  LegacyPaymentsController,
  PaymentsController,
  PaymentSessionsController,
  PaymentWebhookController,
} from './payments.controller';
import { PaymentProcessor } from './processors/payment.processor';
import { PaymentBookingLifecycleService } from './services/payment-booking-lifecycle.service';
import { PaymentService } from './services/payment.service';
import { PaymentReconciliationService } from './services/payment-reconciliation.service';
import { PaymentSessionService } from './services/payment-session.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { TransactionQueryService } from './services/transaction-query.service';
import { SettlementProcessingService } from './services/settlement-processing.service';
import { TransactionsService } from './transactions.service';
@Module({
  imports: [
    RazorpayModule,
    ZohoModule,
    BookingsModule,
    AuthModule,
    GuardsModule,
    PrismaModule,
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
  ],
  controllers: [
    PaymentsController,
    PaymentSessionsController,
    PaymentWebhookController,
    LegacyPaymentsController,
  ],
  providers: [
    TransactionsService,
    { provide: PAYMENT_PROVIDER, useExisting: RAZORPAY_CLIENT },
    { provide: PAYMENT_SERVICE, useClass: PaymentService },
    { provide: PAYMENT_WEBHOOK_SERVICE, useClass: PaymentWebhookService },
    {
      provide: SETTLEMENT_PROCESSING_SERVICE,
      useClass: SettlementProcessingService,
    },
    {
      provide: PAYMENT_RECONCILIATION_SERVICE,
      useClass: PaymentReconciliationService,
    },
    { provide: PAYMENT_SESSION_SERVICE, useClass: PaymentSessionService },
    {
      provide: PAYMENT_BOOKING_LIFECYCLE_SERVICE,
      useClass: PaymentBookingLifecycleService,
    },
    {
      provide: TRANSACTION_QUERY_SERVICE,
      useClass: TransactionQueryService,
    },
    PaymentProcessor,
    AutopayReminderService,
  ],
  exports: [
    PAYMENT_SERVICE,
    PAYMENT_PROVIDER,
    TRANSACTION_QUERY_SERVICE,
    SETTLEMENT_PROCESSING_SERVICE,
  ],
})
export class TransactionsModule {}
