import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  PaymentOrderStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import type { Queue } from 'bullmq';
import PrismaService from '../../../prisma/prisma.service';
import {
  PAYMENT_BOOKING_LIFECYCLE_SERVICE,
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  RECONCILE_PAYMENTS_JOB,
} from '../constants/payment.const';
import type { IPaymentBookingLifecycleService } from '../interfaces/payment-booking-lifecycle-service.interface';
import type { IPaymentProvider } from '../interfaces/payment-provider.interface';

export interface IPaymentReconciliationService {
  reconcileBatch(): Promise<void>;
}

@Injectable()
export class PaymentReconciliationService
  implements IPaymentReconciliationService, OnModuleInit
{
  private readonly _checkoutTtlMs = 15 * 60 * 1000;

  constructor(
    private readonly _prisma: PrismaService,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
    @Inject(PAYMENT_BOOKING_LIFECYCLE_SERVICE)
    private readonly _lifecycle: IPaymentBookingLifecycleService,
    @Inject(PAYMENT_PROVIDER)
    private readonly _provider: IPaymentProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    await this._queue.add(
      RECONCILE_PAYMENTS_JOB,
      {},
      {
        jobId: 'payment-reconciliation-schedule',
        repeat: { every: 300000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async reconcileBatch(): Promise<void> {
    const now = new Date();
    await this._reconcileProcessingPayments();
    const expiredOrders = await this._prisma.paymentOrder.findMany({
      where: {
        status: {
          in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
        },
        expiresAt: { lt: now },
      },
      select: { id: true, transactionId: true },
      take: 100,
    });

    for (const order of expiredOrders) {
      await this._lifecycle.expireOrder(order.id, order.transactionId, now);
    }

    const subscriptionCutoff = new Date(now.getTime() - this._checkoutTtlMs);
    const abandonedSubscriptions =
      await this._prisma.paymentSubscription.findMany({
        where: {
          status: SubscriptionStatus.CREATED,
          createdAt: { lt: subscriptionCutoff },
        },
        select: { id: true, transactionId: true },
        take: 100,
      });

    for (const subscription of abandonedSubscriptions) {
      await this._lifecycle.expireSubscription(
        subscription.id,
        subscription.transactionId,
      );
    }
  }

  private async _reconcileProcessingPayments(): Promise<void> {
    const transactions = await this._prisma.transaction.findMany({
      where: {
        status: PaymentStatus.PROCESSING,
        providerPaymentId: { not: null },
        paymentAttempts: { none: { status: PaymentStatus.SUCCESS } },
      },
      select: {
        id: true,
        providerPaymentId: true,
        paymentOrders: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 100,
    });

    for (const transaction of transactions) {
      const order = transaction.paymentOrders[0];
      if (!transaction.providerPaymentId || !order) continue;
      const remote = await this._provider.fetchPayment(
        transaction.providerPaymentId,
      );
      if (
        !remote.captured ||
        remote.amount !== Number(order.amountMinor) ||
        remote.currency !== order.currency ||
        (remote.orderId && remote.orderId !== order.providerOrderId)
      ) {
        continue;
      }
      const attempt = await this._prisma.paymentAttempt.upsert({
        where: { providerPaymentId: remote.id },
        create: {
          transactionId: transaction.id,
          paymentOrderId: order.id,
          providerPaymentId: remote.id,
          amountMinor: order.amountMinor,
          currency: order.currency,
          status: PaymentStatus.PROCESSING,
          providerStatus: remote.status,
        },
        update: { providerStatus: remote.status },
      });
      await this._lifecycle.markOrderPaid({
        orderId: order.id,
        transactionId: transaction.id,
        attemptId: attempt.id,
        providerPaymentId: remote.id,
      });
    }
  }
}
