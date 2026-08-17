import { SettlementStatus } from '@prisma/client';
import { SettlementProcessingService } from './settlement-processing.service';

describe('SettlementProcessingService', () => {
  it('groups mapped payments by temple and creates one bill per temple', async () => {
    const settlement = {
      id: 'settlement-id',
      providerSettlementId: 'setl_123',
      status: SettlementStatus.PENDING,
      providerCreatedAt: new Date('2026-08-15T06:30:00.000Z'),
    };
    const booking = (
      id: string,
      templeId: string,
      amount: number,
      vendorId: string,
    ) => ({
      id,
      templeId,
      templePayableAmount: amount,
      temple: { zohoVendorId: vendorId },
    });
    const attempts = [
      {
        id: 'a1',
        providerPaymentId: 'pay_1',
        transaction: { booking: booking('b1', 'temple-a', 400, 'vendor-a') },
        bookingOccurrence: null,
      },
      {
        id: 'a2',
        providerPaymentId: 'pay_2',
        transaction: { booking: booking('b2', 'temple-b', 300, 'vendor-b') },
        bookingOccurrence: null,
      },
      {
        id: 'a3',
        providerPaymentId: 'pay_3',
        transaction: { booking: booking('b3', 'temple-a', 600, 'vendor-a') },
        bookingOccurrence: null,
      },
    ];
    const prisma = {
      razorpaySettlement: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(settlement),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      paymentAttempt: { findMany: jest.fn().mockResolvedValue(attempts) },
      settlementPayment: { upsert: jest.fn().mockResolvedValue({}) },
      settlementVendorBill: {
        upsert: jest
          .fn()
          .mockResolvedValueOnce({ id: 'bill-a', zohoBillId: null })
          .mockResolvedValueOnce({ id: 'bill-b', zohoBillId: null }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const provider = {
      fetchSettlementReconciliation: jest.fn().mockResolvedValue({
        hasMore: false,
        items: [
          {
            entityId: 'pay_1',
            type: 'payment',
            settlementId: 'setl_123',
            amount: 50000,
            fee: 100,
            tax: 18,
            currency: 'INR',
          },
          {
            entityId: 'pay_2',
            type: 'payment',
            settlementId: 'setl_123',
            amount: 40000,
            fee: 80,
            tax: 14,
            currency: 'INR',
          },
          {
            entityId: 'pay_3',
            type: 'payment',
            settlementId: 'setl_123',
            amount: 70000,
            fee: 140,
            tax: 25,
            currency: 'INR',
          },
        ],
      }),
    };
    const zoho = {
      createVendorBill: jest
        .fn()
        .mockResolvedValueOnce({ billId: 'zoho-a' })
        .mockResolvedValueOnce({ billId: 'zoho-b' }),
    };
    const service = new SettlementProcessingService(
      prisma as never,
      provider as never,
      zoho as never,
      {} as never,
      { setContext: jest.fn(), error: jest.fn() } as never,
    );

    await service.process('setl_123');

    expect(zoho.createVendorBill).toHaveBeenCalledTimes(2);
    expect(zoho.createVendorBill).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-a',
        lineItems: [expect.objectContaining({ rate: 1000 })],
      }),
    );
    expect(zoho.createVendorBill).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: 'vendor-b',
        lineItems: [expect.objectContaining({ rate: 300 })],
      }),
    );
    const settledDataMatcher: unknown = expect.objectContaining({
      status: SettlementStatus.SETTLED,
    });
    expect(prisma.razorpaySettlement.update.mock.calls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            where: { id: 'settlement-id' },
            data: settledDataMatcher,
          }),
        ],
      ]),
    );
  });

  it('does nothing when a settlement is already settled', async () => {
    const prisma = {
      razorpaySettlement: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ status: SettlementStatus.SETTLED }),
      },
    };
    const provider = { fetchSettlementReconciliation: jest.fn() };
    const zoho = { createVendorBill: jest.fn() };
    const service = new SettlementProcessingService(
      prisma as never,
      provider as never,
      zoho as never,
      {} as never,
      { setContext: jest.fn(), error: jest.fn() } as never,
    );

    await service.process('setl_123');

    expect(provider.fetchSettlementReconciliation).not.toHaveBeenCalled();
    expect(zoho.createVendorBill).not.toHaveBeenCalled();
  });
});
