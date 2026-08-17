import {
  PaymentOrderStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PaymentReconciliationService } from './payment-reconciliation.service';

describe('PaymentReconciliationService', () => {
  it('delegates expired orders and abandoned subscriptions', async () => {
    const prisma = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'processing-transaction-id',
          providerPaymentId: 'pay_123',
          paymentAttempts: [],
          subscriptions: [],
          paymentOrders: [
            {
              id: 'processing-order-id',
              providerOrderId: 'order_123',
              amountMinor: BigInt(10000),
              currency: 'INR',
            },
          ],
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'processing-transaction-id',
            providerPaymentId: 'pay_123',
            paymentOrders: [
              {
                id: 'processing-order-id',
                providerOrderId: 'order_123',
                amountMinor: BigInt(10000),
                currency: 'INR',
              },
            ],
          },
        ]),
      },
      paymentAttempt: {
        upsert: jest.fn().mockResolvedValue({ id: 'attempt-id' }),
      },
      paymentOrder: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-id',
            transactionId: 'transaction-id',
          },
        ]),
      },
      paymentSubscription: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'subscription-id', transactionId: 'weekly-transaction-id' },
          ]),
      },
    };
    const lifecycle = {
      expireOrder: jest.fn().mockResolvedValue(true),
      expireSubscription: jest.fn().mockResolvedValue(true),
      markOrderPaid: jest.fn().mockResolvedValue(true),
      markSubscriptionPaid: jest.fn().mockResolvedValue(true),
    };
    const provider = {
      fetchPayment: jest.fn().mockResolvedValue({
        id: 'pay_123',
        orderId: 'order_123',
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        captured: true,
      }),
    };
    const service = new PaymentReconciliationService(
      prisma as never,
      { add: jest.fn() } as never,
      lifecycle as never,
      provider as never,
    );

    await service.reconcileBatch();
    const anyDate = expect.any(Date) as Date;

    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: [PaymentStatus.PROCESSING, PaymentStatus.EXPIRED],
        },
        providerPaymentId: { not: null },
        paymentAttempts: { none: { status: PaymentStatus.SUCCESS } },
      },
      select: { id: true },
      take: 100,
    });
    expect(lifecycle.markOrderPaid).toHaveBeenCalledWith({
      orderId: 'processing-order-id',
      transactionId: 'processing-transaction-id',
      attemptId: 'attempt-id',
      providerPaymentId: 'pay_123',
    });

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
        },
        expiresAt: { lt: anyDate },
      },
      select: { id: true, transactionId: true },
      take: 100,
    });
    expect(lifecycle.expireOrder).toHaveBeenCalledWith(
      'order-id',
      'transaction-id',
      anyDate,
    );
    expect(prisma.paymentSubscription.findMany).toHaveBeenCalledWith({
      where: {
        status: SubscriptionStatus.CREATED,
        createdAt: { lt: anyDate },
      },
      select: { id: true, transactionId: true },
      take: 100,
    });
    expect(lifecycle.expireSubscription).toHaveBeenCalledWith(
      'subscription-id',
      'weekly-transaction-id',
    );
  });
});
