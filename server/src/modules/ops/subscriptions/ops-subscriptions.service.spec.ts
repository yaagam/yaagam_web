import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { OpsSubscriptionsService } from './ops-subscriptions.service';

describe('OpsSubscriptionsService', () => {
  const record = {
    id: 'subscription-id',
    publicId: 'subscription-reference',
    providerSubscriptionId: 'sub_123',
    status: SubscriptionStatus.ACTIVE,
    totalCount: 8,
    paidCount: 2,
    chargeAt: new Date('2026-08-23T03:30:00.000Z'),
    endedAt: null,
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    updatedAt: new Date('2026-08-17T00:00:00.000Z'),
    plan: { amountMinor: BigInt(500), currency: 'INR' },
    mandate: { status: 'AUTHENTICATED', updatedAt: new Date() },
    transaction: {
      booking: {
        id: 'booking-id',
        bookingNumber: 'YGM-001',
        userId: 'user-id',
        user: { id: 'user-id', whatsappNumber: '+918157988287' },
        pooja: {
          id: 'pooja-id',
          translations: [{ language: 'EN', name: 'Weekly Pooja' }],
        },
        temple: {
          id: 'temple-id',
          translations: [{ language: 'EN', name: 'Temple' }],
        },
      },
      paymentAttempts: [
        {
          status: PaymentStatus.SUCCESS,
          amountMinor: BigInt(500),
          capturedAt: new Date('2026-08-17T00:00:00.000Z'),
          providerPaymentId: 'pay_123',
        },
      ],
    },
    _count: { bookings: 2 },
  };

  function createService() {
    const prisma = {
      paymentSubscription: {
        findMany: jest.fn().mockResolvedValue([record]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue({
          publicId: record.publicId,
          transaction: { booking: { userId: 'user-id' } },
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(record),
      },
    };
    const paymentService = {
      changeSubscription: jest.fn().mockResolvedValue(undefined),
    };
    const paymentProvider = {
      fetchSubscription: jest.fn().mockResolvedValue({
        id: 'sub_123',
        status: 'active',
      }),
    };
    return {
      service: new OpsSubscriptionsService(
        prisma as never,
        paymentService as never,
        paymentProvider as never,
      ),
      prisma,
      paymentService,
    };
  }

  it('returns payment and booking tracking information', async () => {
    const { service } = createService();
    const result = await service.getSubscriptions({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      reference: 'subscription-reference',
      status: SubscriptionStatus.ACTIVE,
      amount: 5,
      paidCount: 2,
      bookingsCount: 2,
      providerStatus: 'active',
      autopayMandateStatus: 'ACTIVE',
      latestPayment: {
        status: PaymentStatus.SUCCESS,
        amount: 5,
        providerPaymentId: 'pay_123',
      },
    });
  });

  it('routes admin actions through the owned payment service transition', async () => {
    const { service, paymentService } = createService();

    const updated = await service.changeSubscription(
      'subscription-id',
      'pause',
    );

    expect(paymentService.changeSubscription).toHaveBeenCalledWith(
      'user-id',
      'subscription-reference',
      'pause',
    );
    expect(updated.status).toBe(SubscriptionStatus.ACTIVE);
  });
});
