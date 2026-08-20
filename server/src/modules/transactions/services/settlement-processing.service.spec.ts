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
      createRazorpayChargesExpense: jest
        .fn()
        .mockResolvedValue({ expenseId: 'zoho-expense' }),
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

    expect(zoho.createRazorpayChargesExpense).toHaveBeenCalledWith({
      settlementId: 'settlement-id',
      referenceNumber: 'RZP-setl_123',
      date: '2026-08-15',
      amount: 3.2,
      taxAmount: 0.57,
    });
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
    const zoho = {
      createRazorpayChargesExpense: jest.fn(),
      createVendorBill: jest.fn(),
    };
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

  it('resets a failed settlement and enqueues an operator retry', async () => {
    const row = {
      id: 'settlement-id',
      providerSettlementId: 'setl_123',
      status: SettlementStatus.FAILED,
      amountMinor: BigInt(500),
      feeMinor: BigInt(0),
      taxMinor: BigInt(0),
      currency: 'INR',
      utr: 'UTR123',
      providerCreatedAt: new Date('2026-08-15T06:30:00.000Z'),
      settledAt: null,
      lastErrorMessage: 'Zoho unavailable',
      _count: { payments: 1 },
      vendorBills: [],
    };
    const updated = {
      ...row,
      status: SettlementStatus.PENDING,
      lastErrorMessage: null,
    };
    const prisma = {
      razorpaySettlement: {
        findUnique: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockResolvedValue(updated),
      },
    };
    const queue = {
      getJob: jest.fn().mockResolvedValue(null),
      add: jest.fn().mockResolvedValue({}),
    };
    const service = new SettlementProcessingService(
      prisma as never,
      {} as never,
      {} as never,
      queue as never,
      { setContext: jest.fn(), error: jest.fn() } as never,
    );

    const result = await service.retry('settlement-id');

    expect(prisma.razorpaySettlement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'settlement-id' },
        data: expect.objectContaining({ status: SettlementStatus.PENDING }),
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'process-settlement',
      { providerSettlementId: 'setl_123' },
      expect.objectContaining({ jobId: 'settlement-setl_123', attempts: 8 }),
    );
    expect(result.status).toBe(SettlementStatus.PENDING);
  });

  it('backfills processed settlements through the normal registration path', async () => {
    const prisma = {
      razorpaySettlement: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const provider = {
      fetchSettlements: jest.fn().mockResolvedValue({
        hasMore: false,
        items: [
          {
            id: 'setl_123',
            amount: 500,
            status: 'processed',
            fees: 10,
            tax: 2,
            utr: 'UTR123',
            createdAt: 1786210200,
          },
          {
            id: 'setl_pending',
            amount: 400,
            status: 'created',
            fees: 0,
            tax: 0,
            createdAt: 1786210201,
          },
        ],
      }),
    };
    const queue = {
      getJob: jest.fn().mockResolvedValue(null),
      add: jest.fn().mockResolvedValue({}),
    };
    const service = new SettlementProcessingService(
      prisma as never,
      provider as never,
      {} as never,
      queue as never,
      { setContext: jest.fn(), error: jest.fn() } as never,
    );

    await service.backfill(3);

    expect(prisma.razorpaySettlement.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.razorpaySettlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerSettlementId: 'setl_123' },
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'process-settlement',
      { providerSettlementId: 'setl_123' },
      expect.any(Object),
    );
  });
});
