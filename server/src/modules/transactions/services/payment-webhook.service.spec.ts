import { PaymentStatus } from '@prisma/client';
import { PaymentWebhookService } from './payment-webhook.service';

describe('PaymentWebhookService ordering', () => {
  it('does not downgrade a captured attempt when failure arrives later', async () => {
    const order = {
      id: 'order-id',
      transactionId: 'transaction-id',
      amountMinor: BigInt(1000),
      currency: 'INR',
    };
    const tx = {
      paymentAttempt: {
        upsert: jest
          .fn<
            Promise<{ id: string; publicId: string }>,
            [Record<string, unknown>]
          >()
          .mockResolvedValue({
            id: 'attempt-id',
            publicId: 'attempt-public-id',
          }),
      },
      paymentOrder: { updateMany: jest.fn() },
      paymentQrCode: { updateMany: jest.fn() },
      transaction: {
        update: jest.fn<void, [Record<string, unknown>]>(),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ bookingId: 'booking-id' }),
      },
      booking: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          status: 'PENDING_PAYMENT',
          poojaDate: new Date(),
        }),
        updateMany: jest.fn(),
      },
      paymentInvoice: { upsert: jest.fn() },
      paymentAuditLog: { create: jest.fn() },
    };
    const prisma = {
      paymentOrder: { findUnique: jest.fn().mockResolvedValue(order) },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
      ),
    };
    const lifecycle = { markFailed: jest.fn().mockResolvedValue(false) };
    const logger = { setContext: jest.fn(), info: jest.fn() };
    const service = new PaymentWebhookService(
      prisma as never,
      {} as never,
      {} as never,
      lifecycle as never,
      logger as never,
    );
    const serviceAccess = service as unknown as {
      _applyPayment: (
        this: PaymentWebhookService,
        type: string,
        payment: Record<string, unknown>,
      ) => Promise<void>;
    };
    const applyPayment = serviceAccess._applyPayment.bind(
      service,
    ) as unknown as (
      type: string,
      paymentData: Record<string, unknown>,
    ) => Promise<void>;
    const payment = {
      id: 'provider-payment-id',
      order_id: 'provider-order-id',
      amount: 1000,
      currency: 'INR',
      status: 'captured',
    };

    await applyPayment('payment.captured', payment);
    await applyPayment('payment.failed', {
      ...payment,
      status: 'failed',
      error_code: 'BAD_REQUEST_ERROR',
    });

    const secondUpsertCall = tx.paymentAttempt.upsert.mock.calls[1]?.[0] as {
      update: { status?: unknown; capturedAt?: unknown };
    };
    expect(secondUpsertCall.update.status).toBeUndefined();
    expect(secondUpsertCall.update.capturedAt).toBeUndefined();
    expect(lifecycle.markFailed).toHaveBeenCalledWith('transaction-id');
    expect(tx.transaction.update).toHaveBeenCalledTimes(1);
    const transactionUpdateCall = tx.transaction.update.mock.calls[0]?.[0] as {
      data: { status: PaymentStatus };
    };
    expect(transactionUpdateCall.data.status).toBe(PaymentStatus.SUCCESS);
  });
});
