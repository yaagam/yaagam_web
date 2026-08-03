import {
  PaymentOrderStatus,
  PaymentQrStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PaymentReconciliationService } from './payment-reconciliation.service';

describe('PaymentReconciliationService', () => {
  it('delegates expired orders and abandoned subscriptions', async () => {
    const prisma = {
      paymentOrder: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-id',
            transactionId: 'transaction-id',
            qrCodes: [{ providerQrId: 'provider-qr-id' }],
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
    const provider = {
      closeQrCode: jest.fn().mockResolvedValue(undefined),
    };
    const lifecycle = {
      expireOrder: jest.fn().mockResolvedValue(true),
      expireSubscription: jest.fn().mockResolvedValue(true),
    };
    const service = new PaymentReconciliationService(
      prisma as never,
      provider as never,
      { add: jest.fn() } as never,
      lifecycle as never,
    );

    await service.reconcileBatch();

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
        },
        expiresAt: { lt: expect.any(Date) },
      },
      include: { qrCodes: { where: { status: PaymentQrStatus.ACTIVE } } },
      take: 100,
    });
    expect(provider.closeQrCode).toHaveBeenCalledWith('provider-qr-id');
    expect(lifecycle.expireOrder).toHaveBeenCalledWith(
      'order-id',
      'transaction-id',
      expect.any(Date),
    );
    expect(prisma.paymentSubscription.findMany).toHaveBeenCalledWith({
      where: {
        status: SubscriptionStatus.CREATED,
        createdAt: { lt: expect.any(Date) },
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
