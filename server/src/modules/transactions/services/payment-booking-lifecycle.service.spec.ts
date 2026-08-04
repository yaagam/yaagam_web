import {
  BookingStatus,
  PaymentOrderStatus,
  PaymentStatus,
} from '@prisma/client';
import { PaymentBookingLifecycleService } from './payment-booking-lifecycle.service';

describe('PaymentBookingLifecycleService', () => {
  function createContext(options?: {
    successfulAttempts?: number;
    transactionStatus?: PaymentStatus;
  }) {
    const tx = {
      paymentAttempt: {
        count: jest.fn().mockResolvedValue(options?.successfulAttempts ?? 0),
        update: jest.fn(),
      },
      paymentOrder: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      paymentQrCode: { updateMany: jest.fn() },
      paymentSubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      transaction: {
        findUnique: jest.fn().mockResolvedValue({
          status: options?.transactionStatus ?? PaymentStatus.PROCESSING,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ bookingId: 'booking-id' }),
      },
      booking: { updateMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
      paymentOrder: { updateMany: jest.fn() },
    };
    return {
      service: new PaymentBookingLifecycleService(prisma as never),
      tx,
    };
  }

  it('does not regress a successful payment when a failed event arrives later', async () => {
    const { service, tx } = createContext({
      successfulAttempts: 1,
      transactionStatus: PaymentStatus.SUCCESS,
    });

    await expect(service.markFailed('transaction-id')).resolves.toBe(false);

    expect(tx.transaction.updateMany).not.toHaveBeenCalled();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it('marks an unpaid transaction and booking as failed', async () => {
    const { service, tx } = createContext();

    await expect(service.markFailed('transaction-id')).resolves.toBe(true);

    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'transaction-id',
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
            PaymentStatus.AUTHORIZED,
          ],
        },
      },
      data: { status: PaymentStatus.FAILED, version: { increment: 1 } },
    });
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        transactions: { some: { id: 'transaction-id' } },
        status: {
          in: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
        },
      },
      data: { status: BookingStatus.PAYMENT_FAILED },
    });
  });

  it('schedules the booking when reconciliation confirms payment', async () => {
    const { service, tx } = createContext();

    await expect(
      service.markOrderPaid({
        orderId: 'order-id',
        transactionId: 'transaction-id',
        attemptId: 'attempt-id',
        providerPaymentId: 'provider-payment-id',
      }),
    ).resolves.toBe(true);

    expect(tx.paymentOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: PaymentOrderStatus.PAID,
          version: { increment: 1 },
        },
      }),
    );
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        status: {
          in: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.PAYMENT_FAILED,
            BookingStatus.CONFIRMED,
          ],
        },
      },
      data: { status: BookingStatus.SCHEDULED },
    });
  });
});
