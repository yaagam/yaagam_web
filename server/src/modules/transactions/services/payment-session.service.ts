import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentOrderStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import type {
  ClientPaymentStatus,
  IPaymentSessionService,
  PaymentSessionSnapshot,
} from '../interfaces/payment-session-service.interface';

@Injectable()
export class PaymentSessionService implements IPaymentSessionService {
  constructor(private readonly _prismaService: PrismaService) {}

  async getSnapshot(
    userId: string,
    publicToken: string,
  ): Promise<PaymentSessionSnapshot> {
    const order = await this._prismaService.paymentOrder.findFirst({
      where: {
        publicId: publicToken,
        transaction: { booking: { userId } },
      },
      include: {
        transaction: true,
        qrCodes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (order) {
      return {
        status: this._orderStatus(order.status, order.transaction.status),
        expiresAt: (order.expiresAt ?? order.createdAt).toISOString(),
        serverTime: new Date().toISOString(),
        qrImageUrl: order.qrCodes[0]?.imageUrl ?? undefined,
      };
    }

    const subscription =
      await this._prismaService.paymentSubscription.findFirst({
        where: {
          publicId: publicToken,
          transaction: { booking: { userId } },
        },
        include: { transaction: true },
      });
    if (subscription) {
      return {
        status: this._subscriptionStatus(
          subscription.status,
          subscription.transaction.status,
        ),
        expiresAt: new Date(
          subscription.createdAt.getTime() + 15 * 60 * 1000,
        ).toISOString(),
        serverTime: new Date().toISOString(),
      };
    }
    throw new NotFoundException('Payment session not found');
  }

  private _orderStatus(
    order: PaymentOrderStatus,
    transaction: PaymentStatus,
  ): ClientPaymentStatus {
    if (
      transaction === PaymentStatus.SUCCESS ||
      order === PaymentOrderStatus.PAID
    )
      return 'success';
    if (
      transaction === PaymentStatus.FAILED ||
      order === PaymentOrderStatus.FAILED
    )
      return 'failed';
    if (order === PaymentOrderStatus.EXPIRED) return 'expired';
    if (order === PaymentOrderStatus.CANCELLED) return 'cancelled';
    if (order === PaymentOrderStatus.ATTEMPTED) return 'processing';
    return 'pending';
  }

  private _subscriptionStatus(
    subscription: SubscriptionStatus,
    transaction: PaymentStatus,
  ): ClientPaymentStatus {
    if (
      transaction === PaymentStatus.SUCCESS ||
      subscription === SubscriptionStatus.ACTIVE
    )
      return 'subscription_active';
    if (
      subscription === SubscriptionStatus.CANCELLED ||
      subscription === SubscriptionStatus.COMPLETED
    )
      return 'subscription_cancelled';
    if (
      transaction === PaymentStatus.FAILED ||
      subscription === SubscriptionStatus.FAILED ||
      subscription === SubscriptionStatus.HALTED
    )
      return 'failed';
    if (subscription === SubscriptionStatus.EXPIRED) return 'expired';
    return 'subscription_pending';
  }
}
