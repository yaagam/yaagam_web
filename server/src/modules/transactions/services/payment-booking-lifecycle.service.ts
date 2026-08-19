import { Inject, Injectable } from '@nestjs/common';
import {
  BookingStatus,
  PaymentOrderStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { BOOKING_PAYMENT_ACTIVATION_SERVICE } from '../../bookings/constants/service-tokens.const';
import type { IBookingPaymentActivationService } from '../../bookings/services/booking-payment-activation.service.interface';
import type {
  IPaymentBookingLifecycleService,
  MarkOrderPaidInput,
  MarkSubscriptionPaidInput,
} from '../interfaces/payment-booking-lifecycle-service.interface';

@Injectable()
export class PaymentBookingLifecycleService implements IPaymentBookingLifecycleService {
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(BOOKING_PAYMENT_ACTIVATION_SERVICE)
    private readonly _bookingPaymentActivationService: IBookingPaymentActivationService,
  ) {}

  async markFailed(transactionId: string): Promise<boolean> {
    return this._prisma.$transaction(async (tx) => {
      const successfulAttempt = await tx.paymentAttempt.count({
        where: { transactionId, status: PaymentStatus.SUCCESS },
      });
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        select: { status: true },
      });
      if (
        successfulAttempt > 0 ||
        !transaction ||
        (
          [
            PaymentStatus.SUCCESS,
            PaymentStatus.CAPTURED,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUNDED,
          ] as PaymentStatus[]
        ).includes(transaction.status)
      )
        return false;

      const updated = await tx.transaction.updateMany({
        where: {
          id: transactionId,
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.PROCESSING,
              PaymentStatus.AUTHORIZED,
            ],
          },
        },
        data: { status: PaymentStatus.FAILED, version: { increment: 1 } },
      });
      if (!updated.count) return false;
      await this._markBooking(tx, transactionId, BookingStatus.PAYMENT_FAILED);
      return true;
    });
  }

  async markCheckoutCreationFailed(
    transactionId: string,
    orderId?: string,
  ): Promise<void> {
    if (orderId)
      await this._prisma.paymentOrder.updateMany({
        where: { id: orderId, status: PaymentOrderStatus.CREATING },
        data: {
          status: PaymentOrderStatus.FAILED,
          version: { increment: 1 },
        },
      });
    await this.markFailed(transactionId);
  }

  async expireOrder(
    orderId: string,
    transactionId: string,
    now: Date,
  ): Promise<boolean> {
    return this._prisma.$transaction(async (tx) => {
      const order = await tx.paymentOrder.updateMany({
        where: {
          id: orderId,
          status: {
            in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
          },
          expiresAt: { lt: now },
        },
        data: {
          status: PaymentOrderStatus.EXPIRED,
          version: { increment: 1 },
        },
      });
      if (!order.count) return false;
      const transaction = await tx.transaction.updateMany({
        where: {
          id: transactionId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        },
        data: { status: PaymentStatus.EXPIRED, version: { increment: 1 } },
      });
      if (!transaction.count) return false;
      await this._markBooking(tx, transactionId, BookingStatus.PAYMENT_FAILED);
      return true;
    });
  }

  async expireSubscription(
    subscriptionId: string,
    transactionId: string,
  ): Promise<boolean> {
    return this._prisma.$transaction(async (tx) => {
      const subscription = await tx.paymentSubscription.updateMany({
        where: { id: subscriptionId, status: SubscriptionStatus.CREATED },
        data: {
          status: SubscriptionStatus.EXPIRED,
          endedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (!subscription.count) return false;
      const transaction = await tx.transaction.updateMany({
        where: {
          id: transactionId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        },
        data: { status: PaymentStatus.EXPIRED, version: { increment: 1 } },
      });
      if (!transaction.count) return false;
      await this._markBooking(tx, transactionId, BookingStatus.PAYMENT_FAILED);
      return true;
    });
  }

  async cancelOrder(orderId: string, transactionId: string): Promise<boolean> {
    return this._prisma.$transaction(async (tx) => {
      const order = await tx.paymentOrder.updateMany({
        where: {
          id: orderId,
          status: {
            in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
          },
        },
        data: {
          status: PaymentOrderStatus.CANCELLED,
          version: { increment: 1 },
        },
      });
      if (!order.count) return false;
      const transaction = await tx.transaction.updateMany({
        where: {
          id: transactionId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        },
        data: { status: PaymentStatus.CANCELLED, version: { increment: 1 } },
      });
      if (!transaction.count) return false;
      await this._markBooking(tx, transactionId, BookingStatus.CANCELLED);
      return true;
    });
  }

  async markOrderPaid(input: MarkOrderPaidInput): Promise<boolean> {
    const paid = await this._prisma.$transaction(async (tx) => {
      const order = await tx.paymentOrder.updateMany({
        where: {
          id: input.orderId,
          status: {
            in: [
              PaymentOrderStatus.CREATED,
              PaymentOrderStatus.ATTEMPTED,
              PaymentOrderStatus.EXPIRED,
            ],
          },
        },
        data: { status: PaymentOrderStatus.PAID, version: { increment: 1 } },
      });
      if (!order.count) return false;
      await tx.paymentAttempt.update({
        where: { id: input.attemptId },
        data: { status: PaymentStatus.SUCCESS, capturedAt: new Date() },
      });
      await tx.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: PaymentStatus.SUCCESS,
          providerPaymentId: input.providerPaymentId,
          paidAt: new Date(),
          version: { increment: 1 },
        },
      });
      return true;
    });
    if (!paid) return false;
    await this._bookingPaymentActivationService.activatePaidOccurrence({
      transactionId: input.transactionId,
      paymentAttemptId: input.attemptId,
    });
    return true;
  }

  async markSubscriptionPaid(
    input: MarkSubscriptionPaidInput,
  ): Promise<boolean> {
    const paid = await this._prisma.$transaction(async (tx) => {
      const existingAttempt = await tx.paymentAttempt.findUnique({
        where: { providerPaymentId: input.providerPaymentId },
      });
      if (existingAttempt?.status === PaymentStatus.SUCCESS) return false;
      const attempt = await tx.paymentAttempt.upsert({
        where: { providerPaymentId: input.providerPaymentId },
        create: {
          transactionId: input.transactionId,
          providerPaymentId: input.providerPaymentId,
          amountMinor: input.amountMinor,
          currency: input.currency,
          status: PaymentStatus.SUCCESS,
          providerStatus: input.providerStatus,
          capturedAt: new Date(),
        },
        update: {
          status: PaymentStatus.SUCCESS,
          providerStatus: input.providerStatus,
          capturedAt: new Date(),
        },
      });
      await tx.paymentSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          status: SubscriptionStatus.AUTHENTICATED,
          paidCount: { increment: 1 },
          endedAt: null,
          version: { increment: 1 },
        },
      });
      await tx.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: PaymentStatus.SUCCESS,
          providerPaymentId: input.providerPaymentId,
          paidAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.paymentInvoice.upsert({
        where: { paymentAttemptId: attempt.id },
        create: {
          invoiceNumber: `INV-${new Date().getUTCFullYear()}-${attempt.publicId.replaceAll('-', '').slice(0, 12).toUpperCase()}`,
          transactionId: input.transactionId,
          paymentAttemptId: attempt.id,
          amountMinor: input.amountMinor,
          currency: input.currency,
          metadata: { providerPaymentId: input.providerPaymentId },
        },
        update: {},
      });
      return attempt.id;
    });
    if (!paid) return false;
    await this._bookingPaymentActivationService.activatePaidOccurrence({
      transactionId: input.transactionId,
      paymentAttemptId: paid,
      subscriptionId: input.subscriptionId,
    });
    return true;
  }

  private async _markBooking(
    tx: Prisma.TransactionClient,
    transactionId: string,
    status: BookingStatus,
  ): Promise<void> {
    await tx.booking.updateMany({
      where: {
        transactions: { some: { id: transactionId } },
        status: {
          in: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
        },
      },
      data: { status },
    });
  }
}
