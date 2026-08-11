import { Inject, Injectable } from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { BOOKING_ZOHO_SYNC_SERVICE } from '../constants/service-tokens.const';
import type { IBookingZohoSyncService } from './booking-zoho-sync.service.interface';
import type {
  ActivatePaidOccurrenceInput,
  IBookingPaymentActivationService,
} from './booking-payment-activation.service.interface';

@Injectable()
export class BookingPaymentActivationService implements IBookingPaymentActivationService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(BOOKING_ZOHO_SYNC_SERVICE)
    private readonly _bookingZohoSyncService: IBookingZohoSyncService,
  ) {}

  async activatePaidOccurrence({
    transactionId,
    paymentAttemptId,
    subscriptionId,
  }: ActivatePaidOccurrenceInput): Promise<void> {
    if (subscriptionId) {
      const subscription =
        await this._prismaService.paymentSubscription.findUnique({
          where: { id: subscriptionId },
          select: { status: true },
        });
      if (
        !subscription ||
        !(
          [
            SubscriptionStatus.AUTHENTICATED,
            SubscriptionStatus.ACTIVE,
          ] as SubscriptionStatus[]
        ).includes(subscription.status)
      ) {
        return;
      }
    }

    const existing = await this._prismaService.bookingOccurrence.findUnique({
      where: { paymentAttemptId },
      select: { id: true },
    });
    if (existing) {
      await this._bookingZohoSyncService.syncPaidOccurrence(existing.id);
      return;
    }

    const transaction = await this._prismaService.transaction.findUniqueOrThrow(
      {
        where: { id: transactionId },
        include: {
          booking: {
            include: {
              occurrences: { orderBy: { sequence: 'desc' }, take: 1 },
            },
          },
          paymentAttempts: {
            where: { id: paymentAttemptId, status: PaymentStatus.SUCCESS },
            take: 1,
          },
        },
      },
    );
    const attempt = transaction.paymentAttempts[0];
    if (!attempt) return;

    const previous = transaction.booking.occurrences[0];
    const sequence = (previous?.sequence ?? 0) + 1;
    const poojaDate = previous
      ? new Date(previous.poojaDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : transaction.booking.poojaDate;
    const occurrence = await this._prismaService.bookingOccurrence.create({
      data: {
        bookingId: transaction.bookingId,
        paymentAttemptId: attempt.id,
        sequence,
        poojaDate,
        status: BookingStatus.SCHEDULED,
        amountMinor: attempt.amountMinor,
        currency: attempt.currency,
      },
    });
    await this._prismaService.booking.update({
      where: { id: transaction.bookingId },
      data: {
        status: BookingStatus.SCHEDULED,
        poojaDate,
        activatedAt: transaction.booking.activatedAt ?? new Date(),
      },
    });
    await this._bookingZohoSyncService.syncPaidOccurrence(occurrence.id);
  }
}
