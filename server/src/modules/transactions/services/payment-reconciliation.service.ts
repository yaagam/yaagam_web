import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  PaymentOrderStatus,
  PaymentQrStatus,
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
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
    @Inject(PAYMENT_BOOKING_LIFECYCLE_SERVICE)
    private readonly _lifecycle: IPaymentBookingLifecycleService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this._queue.add(
      RECONCILE_PAYMENTS_JOB,
      {},
      {
        jobId: 'payment-reconciliation-schedule',
        repeat: { every: 300000 },
        removeOnComplete: true,
      },
    );
  }

  async reconcileBatch(): Promise<void> {
    const now = new Date();
    const expiredOrders = await this._prisma.paymentOrder.findMany({
      where: {
        status: {
          in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
        },
        expiresAt: { lt: now },
      },
      include: { qrCodes: { where: { status: PaymentQrStatus.ACTIVE } } },
      take: 100,
    });

    for (const order of expiredOrders) {
      for (const qr of order.qrCodes) {
        if (qr.providerQrId)
          await this._provider
            .closeQrCode(qr.providerQrId)
            .catch(() => undefined);
      }
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
}
