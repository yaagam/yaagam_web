import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { PaymentOrderStatus, PaymentQrStatus } from '@prisma/client';
import type { Queue } from 'bullmq';
import PrismaService from '../../../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  RECONCILE_PAYMENTS_JOB,
} from '../constants/payment.const';
import type { IPaymentProvider } from '../interfaces/payment-provider.interface';
export interface IPaymentReconciliationService {
  reconcileBatch(): Promise<void>;
}
@Injectable()
export class PaymentReconciliationService
  implements IPaymentReconciliationService, OnModuleInit
{
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
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
    const expired = await this._prisma.paymentOrder.findMany({
      where: {
        status: {
          in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
        },
        expiresAt: { lt: now },
      },
      include: { qrCodes: { where: { status: PaymentQrStatus.ACTIVE } } },
      take: 100,
    });
    for (const order of expired) {
      for (const qr of order.qrCodes) {
        if (qr.providerQrId)
          await this._provider
            .closeQrCode(qr.providerQrId)
            .catch(() => undefined);
      }
      await this._prisma.$transaction([
        this._prisma.paymentOrder.updateMany({
          where: {
            id: order.id,
            status: {
              in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
            },
          },
          data: {
            status: PaymentOrderStatus.EXPIRED,
            version: { increment: 1 },
          },
        }),
        this._prisma.paymentQrCode.updateMany({
          where: { paymentOrderId: order.id, status: PaymentQrStatus.ACTIVE },
          data: { status: PaymentQrStatus.EXPIRED },
        }),
      ]);
    }
  }
}
