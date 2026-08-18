import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  MandateStatus,
  PaymentOrderStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
  WebhookProcessingStatus,
} from '@prisma/client';
import type { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import {
  PAYMENT_BOOKING_LIFECYCLE_SERVICE,
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  PROCESS_WEBHOOK_JOB,
  SETTLEMENT_PROCESSING_SERVICE,
} from '../constants/payment.const';
import type { IPaymentBookingLifecycleService } from '../interfaces/payment-booking-lifecycle-service.interface';
import type { IPaymentProvider } from '../interfaces/payment-provider.interface';
import type { ISettlementProcessingService } from '../interfaces/settlement-processing-service.interface';
import type {
  IPaymentWebhookService,
  IWebhookReceipt,
} from '../interfaces/payment-webhook-service.interface';
import { BOOKING_PAYMENT_ACTIVATION_SERVICE } from '../../bookings/constants/service-tokens.const';
import type { IBookingPaymentActivationService } from '../../bookings/services/booking-payment-activation.service.interface';

type RecordValue = Record<string, unknown>;
@Injectable()
export class PaymentWebhookService implements IPaymentWebhookService {
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
    @Inject(PAYMENT_BOOKING_LIFECYCLE_SERVICE)
    private readonly _lifecycle: IPaymentBookingLifecycleService,
    @Inject(BOOKING_PAYMENT_ACTIVATION_SERVICE)
    private readonly _bookingPaymentActivationService: IBookingPaymentActivationService,
    @Inject(SETTLEMENT_PROCESSING_SERVICE)
    private readonly _settlements: ISettlementProcessingService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(PaymentWebhookService.name);
  }
  async receive(
    rawBody: Buffer,
    signature: string,
    eventId: string,
  ): Promise<IWebhookReceipt> {
    if (!rawBody.length || rawBody.length > 1024 * 1024)
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_BODY',
        message: 'Webhook body is invalid',
      });
    if (!this._provider.verifyWebhookSignature(rawBody, signature))
      throw new UnauthorizedException({
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Webhook signature is invalid',
      });
    if (!/^[\w-]{8,128}$/.test(eventId))
      throw new BadRequestException({
        code: 'INVALID_EVENT_ID',
        message: 'Webhook event identifier is invalid',
      });
    let payload: RecordValue;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as RecordValue;
    } catch {
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_JSON',
        message: 'Webhook payload is invalid',
      });
    }
    if (typeof payload.event !== 'string')
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK_EVENT',
        message: 'Webhook event type is missing',
      });
    const digest = createHash('sha256').update(signature).digest('hex');
    const existing = await this._prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId: eventId },
    });
    if (existing) {
      if (
        existing.processingStatus === WebhookProcessingStatus.RECEIVED ||
        existing.processingStatus === WebhookProcessingStatus.FAILED
      ) {
        await this._enqueue(existing.id);
      }
      return { duplicate: true, eventReference: existing.id };
    }
    const event = await this._prisma.paymentWebhookEvent.create({
      data: {
        providerEventId: eventId,
        eventType: payload.event,
        signatureDigest: digest,
        payload: payload as Prisma.InputJsonValue,
        processingStatus: WebhookProcessingStatus.RECEIVED,
      },
    });
    await this._enqueue(event.id);
    this._logger.info(
      { eventId: event.id, eventType: event.eventType },
      'payment webhook received',
    );
    return { duplicate: false, eventReference: event.id };
  }
  async process(eventId: string): Promise<void> {
    const claimed = await this._prisma.paymentWebhookEvent.updateMany({
      where: {
        id: eventId,
        processingStatus: {
          in: [
            WebhookProcessingStatus.RECEIVED,
            WebhookProcessingStatus.FAILED,
          ],
        },
      },
      data: {
        processingStatus: WebhookProcessingStatus.PROCESSING,
        attemptCount: { increment: 1 },
      },
    });
    if (!claimed.count) return;
    const event = await this._prisma.paymentWebhookEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    try {
      const payload = event.payload as RecordValue;
      await this._apply(event.eventType, payload);
      await this._prisma.paymentWebhookEvent.update({
        where: { id: eventId },
        data: {
          processingStatus: WebhookProcessingStatus.PROCESSED,
          processedAt: new Date(),
          lastErrorMessage: null,
        },
      });
      this._logger.info(
        { eventId, eventType: event.eventType },
        'payment webhook processed',
      );
    } catch (error) {
      await this._prisma.paymentWebhookEvent.update({
        where: { id: eventId },
        data: {
          processingStatus: WebhookProcessingStatus.FAILED,
          nextRetryAt: new Date(
            Date.now() + Math.min(3600000, 2 ** event.attemptCount * 2000),
          ),
          lastErrorMessage:
            error instanceof Error
              ? error.message.slice(0, 500)
              : 'Unknown processing failure',
        },
      });
      throw error;
    }
  }
  private async _apply(type: string, payload: RecordValue): Promise<void> {
    if (type === 'settlement.processed') {
      await this._settlements.register(this._record(payload.payload));
      return;
    }
    const entity = this._record(
      this._record(this._record(payload.payload)?.payment)?.entity,
    );
    if (type === 'payment.captured' || type === 'payment.failed') {
      await this._applyPayment(type, entity);
      return;
    }
    const subscription = this._record(
      this._record(this._record(payload.payload)?.subscription)?.entity,
    );
    if (type.startsWith('subscription.')) {
      if (type === 'subscription.charged' && this._string(entity.id)) {
        await this._applyPayment('payment.captured', entity);
      }
      await this._applySubscription(type, subscription);
      return;
    }
    await this._prisma.paymentWebhookEvent.updateMany({
      where: { providerEventId: { equals: (payload.id as string) ?? '' } },
      data: { processingStatus: WebhookProcessingStatus.IGNORED },
    });
  }
  private async _applyPayment(
    type: string,
    payment: RecordValue,
  ): Promise<void> {
    const providerPaymentId = this._string(payment.id);
    const providerOrderId = this._string(payment.order_id);
    const providerSubscriptionId = this._string(payment.subscription_id);
    const amount = this._number(payment.amount);
    const currency = this._string(payment.currency);
    if (!providerPaymentId || amount === null || !currency)
      throw new Error('Invalid payment entity');
    const order = providerOrderId
      ? await this._prisma.paymentOrder.findUnique({
          where: { providerOrderId },
        })
      : null;
    const subscription =
      !order && providerSubscriptionId
        ? await this._prisma.paymentSubscription.findUnique({
            where: { providerSubscriptionId },
            include: { plan: true },
          })
        : null;
    const transactionId = order?.transactionId ?? subscription?.transactionId;
    const expectedAmount = order?.amountMinor ?? subscription?.plan.amountMinor;
    const expectedCurrency = order?.currency ?? subscription?.plan.currency;
    if (!transactionId || expectedAmount === undefined)
      throw new Error('Payment is not linked to a known order or subscription');
    const subscriptionMetadata = subscription
      ? this._record(subscription.metadata)
      : {};
    const initialAmount = this._number(subscriptionMetadata.initialAmountMinor);
    const validAmounts = [Number(expectedAmount), initialAmount].filter(
      (value): value is number => value !== null,
    );
    if (!validAmounts.includes(amount) || expectedCurrency !== currency)
      throw new Error('Payment amount or currency mismatch');
    const success = type === 'payment.captured';
    let paidAttemptId: string | undefined;
    await this._prisma.$transaction(async (tx) => {
      const attempt = await tx.paymentAttempt.upsert({
        where: { providerPaymentId },
        create: {
          transactionId,
          paymentOrderId: order?.id,
          providerPaymentId,
          amountMinor: BigInt(amount),
          currency,
          status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          providerStatus: this._string(payment.status),
          providerPayload: payment as Prisma.InputJsonValue,
          capturedAt: success ? new Date() : null,
          failureCode: this._string(payment.error_code),
          failureReason: this._string(payment.error_description),
        },
        update: {
          providerStatus: this._string(payment.status),
          providerPayload: payment as Prisma.InputJsonValue,
          status: success ? PaymentStatus.SUCCESS : undefined,
          capturedAt: success ? new Date() : undefined,
        },
      });
      if (!success) return;
      paidAttemptId = attempt.id;
      if (order) {
        await tx.paymentOrder.updateMany({
          where: {
            id: order.id,
            status: {
              in: [PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED],
            },
          },
          data: { status: PaymentOrderStatus.PAID, version: { increment: 1 } },
        });
      }
      if (subscription)
        await tx.paymentSubscription.update({
          where: { id: subscription.id },
          data: {
            paidCount: { increment: 1 },
            version: { increment: 1 },
          },
        });
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: PaymentStatus.SUCCESS,
          providerPaymentId,
          paidAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.paymentInvoice.upsert({
        where: { paymentAttemptId: attempt.id },
        create: {
          invoiceNumber: `INV-${new Date().getUTCFullYear()}-${attempt.publicId.replaceAll('-', '').slice(0, 12).toUpperCase()}`,
          transactionId,
          paymentAttemptId: attempt.id,
          amountMinor: BigInt(amount),
          currency,
          metadata: { providerPaymentId },
        },
        update: {},
      });
      await tx.paymentAuditLog.create({
        data: {
          aggregateType: order ? 'PaymentOrder' : 'PaymentSubscription',
          aggregateId: order?.id ?? subscription!.id,
          action: 'CAPTURED',
          actorType: 'WEBHOOK',
          nextState: { attemptId: attempt.id },
          metadata: {},
        },
      });
    });
    if (success && paidAttemptId) {
      await this._bookingPaymentActivationService.activatePaidOccurrence({
        transactionId,
        paymentAttemptId: paidAttemptId,
        subscriptionId: subscription?.id,
      });
    }
    if (!success) await this._lifecycle.markFailed(transactionId);
  }
  private async _applySubscription(
    type: string,
    value: RecordValue,
  ): Promise<void> {
    const providerId = this._string(value.id);
    if (!providerId) throw new Error('Invalid subscription entity');
    const statusMap: Record<string, SubscriptionStatus> = {
      'subscription.authenticated': SubscriptionStatus.AUTHENTICATED,
      'subscription.activated': SubscriptionStatus.ACTIVE,
      'subscription.charged': SubscriptionStatus.ACTIVE,
      'subscription.pending': SubscriptionStatus.CREATED,
      'subscription.paused': SubscriptionStatus.PAUSED,
      'subscription.resumed': SubscriptionStatus.ACTIVE,
      'subscription.halted': SubscriptionStatus.HALTED,
      'subscription.cancelled': SubscriptionStatus.CANCELLED,
      'subscription.completed': SubscriptionStatus.COMPLETED,
    };
    const status = statusMap[type];
    if (!status) return;
    await this._prisma.paymentSubscription.updateMany({
      where: { providerSubscriptionId: providerId },
      data: {
        status,
        paidCount: this._number(value.paid_count) ?? undefined,
        chargeAt: this._date(value.charge_at),
        endedAt: ['CANCELLED', 'COMPLETED'].includes(status)
          ? new Date()
          : undefined,
        version: { increment: 1 },
      },
    });
    const mandateStatusMap: Partial<Record<SubscriptionStatus, MandateStatus>> =
      {
        [SubscriptionStatus.AUTHENTICATED]: MandateStatus.AUTHENTICATED,
        [SubscriptionStatus.ACTIVE]: MandateStatus.ACTIVE,
        [SubscriptionStatus.CANCELLED]: MandateStatus.REVOKED,
        [SubscriptionStatus.COMPLETED]: MandateStatus.EXPIRED,
        [SubscriptionStatus.EXPIRED]: MandateStatus.EXPIRED,
        [SubscriptionStatus.FAILED]: MandateStatus.FAILED,
      };
    const mandateStatus = mandateStatusMap[status];
    if (mandateStatus) {
      await this._prisma.paymentMandate.updateMany({
        where: {
          subscription: { providerSubscriptionId: providerId },
        },
        data: {
          status: mandateStatus,
          providerPayload: value as Prisma.InputJsonValue,
        },
      });
    }
    if (
      status === SubscriptionStatus.AUTHENTICATED ||
      status === SubscriptionStatus.ACTIVE
    ) {
      const localSubscription =
        await this._prisma.paymentSubscription.findUnique({
          where: { providerSubscriptionId: providerId },
          include: {
            transaction: {
              include: {
                paymentAttempts: {
                  where: { status: PaymentStatus.SUCCESS },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        });
      const attempt = localSubscription?.transaction.paymentAttempts[0];
      if (localSubscription && attempt) {
        await this._bookingPaymentActivationService.activatePaidOccurrence({
          transactionId: localSubscription.transactionId,
          paymentAttemptId: attempt.id,
          subscriptionId: localSubscription.id,
        });
      }
    }
  }
  private _record(value: unknown): RecordValue {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as RecordValue)
      : {};
  }
  private _string(value: unknown): string | null {
    return typeof value === 'string' && value.length ? value : null;
  }
  private _number(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value)
      ? value
      : null;
  }
  private _date(value: unknown): Date | undefined {
    const number = this._number(value);
    return number ? new Date(number * 1000) : undefined;
  }

  private async _enqueue(eventId: string): Promise<void> {
    const existing = await this._queue.getJob(eventId);
    if (existing) {
      const state = await existing.getState();
      if (state === 'failed' || state === 'completed') {
        await existing.remove();
      } else {
        return;
      }
    }
    await this._queue.add(
      PROCESS_WEBHOOK_JOB,
      { eventId },
      {
        jobId: eventId,
        attempts: 8,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
