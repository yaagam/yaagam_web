import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
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
      )
        return;
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
              devotees: { orderBy: { position: 'asc' } },
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

    const previous = subscriptionId
      ? await this._prismaService.bookingOccurrence.findFirst({
          where: { booking: { subscriptionId } },
          orderBy: { poojaDate: 'desc' },
        })
      : transaction.booking.occurrences[0];
    const sequence = (previous?.sequence ?? 0) + 1;
    const poojaDate = previous
      ? new Date(previous.poojaDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : transaction.booking.poojaDate;

    const result = await this._prismaService.$transaction(async (tx) => {
      let bookingId = transaction.bookingId;
      if (subscriptionId && previous) {
        const source = transaction.booking;
        const devoteeCount = source.devotees.length;
        const templePayableAmount = Number(source.baseAmount) * devoteeCount;
        const finalAmount = Number(source.discountAmount) * devoteeCount;
        const booking = await tx.booking.create({
          data: {
            bookingNumber: this._createBookingNumber(),
            userId: source.userId,
            poojaId: source.poojaId,
            templeId: source.templeId,
            subscriptionId,
            devoteeSnapshot: source.devoteeSnapshot as Prisma.InputJsonValue,
            poojaSnapshot: source.poojaSnapshot as Prisma.InputJsonValue,
            templeSnapshot: source.templeSnapshot as Prisma.InputJsonValue,
            addressSnapshot: source.addressSnapshot as Prisma.InputJsonValue,
            bookingWhatsappNumber: source.bookingWhatsappNumber,
            type: source.type,
            baseAmount: source.baseAmount,
            discountAmount: source.discountAmount,
            finalAmount,
            dakshinaAmount: 0,
            offeringTotal: 0,
            platformFeeAmount: source.poojaPlatformFeeAmount,
            platformFeeGstAmount: source.poojaPlatformFeeGstAmount,
            poojaPlatformFeeAmount: source.poojaPlatformFeeAmount,
            poojaPlatformFeeGstAmount: source.poojaPlatformFeeGstAmount,
            templePayableAmount,
            bookingDate: new Date(),
            poojaDate,
            status: BookingStatus.SCHEDULED,
            sankalpa: source.sankalpa,
            activatedAt: new Date(),
            devotees: {
              create: source.devotees.map((devotee) => ({
                name: devotee.name,
                naal: devotee.naal,
                position: devotee.position,
              })),
            },
          },
        });
        const cycleTransaction = await tx.transaction.create({
          data: {
            bookingId: booking.id,
            type: transaction.type,
            provider: transaction.provider,
            providerPaymentId: attempt.providerPaymentId,
            amount: Number(attempt.amountMinor) / 100,
            status: PaymentStatus.SUCCESS,
            paidAt: attempt.capturedAt ?? new Date(),
          },
        });
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: { transactionId: cycleTransaction.id },
        });
        await tx.paymentInvoice.updateMany({
          where: { paymentAttemptId: attempt.id },
          data: { transactionId: cycleTransaction.id },
        });
        bookingId = booking.id;
      }
      const occurrence = await tx.bookingOccurrence.create({
        data: {
          bookingId,
          paymentAttemptId: attempt.id,
          sequence,
          poojaDate,
          status: BookingStatus.SCHEDULED,
          amountMinor: attempt.amountMinor,
          currency: attempt.currency,
        },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.SCHEDULED,
          poojaDate,
          activatedAt: new Date(),
        },
      });
      return occurrence;
    });
    await this._bookingZohoSyncService.syncPaidOccurrence(result.id);
  }

  private _createBookingNumber(): string {
    return `YG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  }
}
