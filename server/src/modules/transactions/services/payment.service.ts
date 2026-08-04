import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  PaymentOrderStatus,
  PaymentQrStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import {
  PAYMENT_BOOKING_LIFECYCLE_SERVICE,
  PAYMENT_PROVIDER,
} from '../constants/payment.const';
import type { CreatePaymentDto } from '../dtos/create-payment.dto';
import type { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import {
  IdempotencyConflictError,
  PaymentInProgressError,
  PaymentNotFoundError,
} from '../errors/payment.errors';
import type { IPaymentBookingLifecycleService } from '../interfaces/payment-booking-lifecycle-service.interface';
import type { IPaymentProvider } from '../interfaces/payment-provider.interface';
import type {
  IPaymentService,
  PaymentInformation,
  SubscriptionInformation,
} from '../interfaces/payment-service.interface';
import { assertSubscriptionTransition } from '../domain/payment-state-machine';

@Injectable()
export class PaymentService implements IPaymentService {
  private readonly _currency = 'INR';
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @Inject(PAYMENT_BOOKING_LIFECYCLE_SERVICE)
    private readonly _lifecycle: IPaymentBookingLifecycleService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(PaymentService.name);
  }
  async createPayment(
    userId: string,
    key: string,
    dto: CreatePaymentDto,
    correlationId?: string,
  ): Promise<PaymentInformation> {
    const requestHash = this._hash(JSON.stringify(dto));
    const cached = await this._claimIdempotency(
      userId,
      'create-payment',
      key,
      requestHash,
    );
    if (cached) return cached as unknown as PaymentInformation;
    const booking = await this._prisma.booking.findFirst({
      where: { publicId: dto.bookingReference, userId },
      include: {
        transactions: {
          where: {
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!booking) throw new PaymentNotFoundError();
    const transaction = booking.transactions[0];
    if (!transaction)
      throw new ConflictException({
        code: 'NO_PAYABLE_TRANSACTION',
        message: 'No pending transaction exists for this booking',
      });
    const amountMinor = Math.round(Number(transaction.amount) * 100);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const receipt = `ygm_${transaction.publicId.replaceAll('-', '').slice(0, 24)}`;
    const local = await this._prisma.paymentOrder.create({
      data: {
        transactionId: transaction.id,
        receipt,
        amountMinor: BigInt(amountMinor),
        currency: this._currency,
        status: PaymentOrderStatus.CREATING,
        expiresAt,
        metadata: { correlationId: correlationId ?? null },
      },
    });
    try {
      const order = await this._provider.createOrder({
        amount: amountMinor,
        currency: this._currency,
        receipt,
        notes: { payment_ref: local.publicId, booking_ref: booking.publicId },
      });
      if (
        order.amount !== amountMinor ||
        order.currency !== this._currency ||
        order.receipt !== receipt
      )
        throw new ConflictException({
          code: 'PROVIDER_ORDER_MISMATCH',
          message: 'Provider order did not match the payment request',
        });
      const qr = await this._provider.createQrCode({
        amount: amountMinor,
        name: `Yaagam ${booking.bookingNumber}`,
        description: dto.description,
        closeBy: Math.floor(expiresAt.getTime() / 1000),
        notes: { payment_ref: local.publicId },
      });
      const result = await this._prisma.$transaction(async (tx) => {
        await tx.paymentOrder.update({
          where: { id: local.id },
          data: {
            providerOrderId: order.id,
            status: PaymentOrderStatus.CREATED,
            version: { increment: 1 },
          },
        });
        const savedQr = await tx.paymentQrCode.create({
          data: {
            paymentOrderId: local.id,
            providerQrId: qr.id,
            imageUrl: qr.imageUrl,
            status: PaymentQrStatus.ACTIVE,
            amountMinor: BigInt(amountMinor),
            currency: this._currency,
            expiresAt,
            metadata: {},
          },
        });
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            providerOrderId: order.id,
            status: PaymentStatus.PROCESSING,
            version: { increment: 1 },
          },
        });
        await this._audit(
          tx,
          'PaymentOrder',
          local.id,
          'CREATED',
          userId,
          correlationId,
        );
        return {
          paymentReference: local.publicId,
          status: PaymentOrderStatus.CREATED,
          amount: amountMinor,
          currency: this._currency,
          expiresAt,
          qr: { reference: savedQr.publicId, imageUrl: savedQr.imageUrl },
        };
      });
      await this._completeIdempotency(
        userId,
        'create-payment',
        key,
        result,
        local.id,
      );
      this._logger.info(
        { paymentReference: local.publicId, correlationId },
        'payment order and QR created',
      );
      return result;
    } catch (error) {
      await this._lifecycle.markCheckoutCreationFailed(
        transaction.id,
        local.id,
      );
      await this._failIdempotency(userId, 'create-payment', key);
      throw error;
    }
  }
  async getPayment(
    userId: string,
    reference: string,
  ): Promise<Record<string, unknown>> {
    const order = await this._ownedOrder(userId, reference);
    return {
      paymentReference: order.publicId,
      status: order.status,
      amount: Number(order.amountMinor),
      currency: order.currency,
      expiresAt: order.expiresAt,
      qr: order.qrCodes[0]
        ? {
            reference: order.qrCodes[0].publicId,
            imageUrl: order.qrCodes[0].imageUrl,
            status: order.qrCodes[0].status,
          }
        : null,
    };
  }
  async cancelPayment(userId: string, reference: string): Promise<void> {
    const order = await this._ownedOrder(userId, reference);
    if (!['CREATED', 'ATTEMPTED'].includes(order.status))
      throw new ConflictException({
        code: 'PAYMENT_NOT_CANCELLABLE',
        message: 'Payment cannot be cancelled in its current state',
      });
    const qr = order.qrCodes[0];
    if (qr?.providerQrId) await this._provider.closeQrCode(qr.providerQrId);
    const cancelled = await this._lifecycle.cancelOrder(
      order.id,
      order.transactionId,
      qr?.id,
    );
    if (!cancelled)
      throw new ConflictException({
        code: 'PAYMENT_NOT_CANCELLABLE',
        message: 'Payment was already processed',
      });
  }
  async reconcilePayment(
    userId: string,
    reference: string,
  ): Promise<Record<string, unknown>> {
    const order = await this._ownedOrder(userId, reference);
    const attempt = await this._prisma.paymentAttempt.findFirst({
      where: { paymentOrderId: order.id, providerPaymentId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (attempt?.providerPaymentId) {
      const remote = await this._provider.fetchPayment(
        attempt.providerPaymentId,
      );
      if (
        remote.amount !== Number(order.amountMinor) ||
        remote.currency !== order.currency
      )
        throw new ConflictException({
          code: 'RECONCILIATION_MISMATCH',
          message: 'Provider payment does not match local records',
        });
      if (remote.captured)
        await this._markPaid(
          order.id,
          order.transactionId,
          attempt.id,
          remote.id,
        );
    }
    return this.getPayment(userId, reference);
  }
  async createSubscription(
    userId: string,
    key: string,
    dto: CreateSubscriptionDto,
    correlationId?: string,
  ): Promise<SubscriptionInformation> {
    const hash = this._hash(JSON.stringify(dto));
    const cached = await this._claimIdempotency(
      userId,
      'create-subscription',
      key,
      hash,
    );
    if (cached) return cached as unknown as SubscriptionInformation;
    const booking = await this._prisma.booking.findFirst({
      where: { publicId: dto.bookingReference, userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!booking || !booking.transactions[0]) throw new PaymentNotFoundError();
    const transaction = booking.transactions[0];
    const amount = Math.round(Number(transaction.amount) * 100);
    let plan = await this._prisma.paymentPlan.findFirst({
      where: {
        amountMinor: BigInt(amount),
        currency: this._currency,
        intervalCount: 1,
        isActive: true,
      },
    });
    if (!plan) {
      const remotePlan = await this._provider.createPlan({
        name: dto.name,
        amount,
        currency: this._currency,
        interval: 1,
        notes: { booking_ref: booking.publicId },
      });
      plan = await this._prisma.paymentPlan.create({
        data: {
          providerPlanId: remotePlan.id,
          name: dto.name,
          amountMinor: BigInt(amount),
          currency: this._currency,
          intervalCount: 1,
          metadata: {},
        },
      });
    }
    const local = await this._prisma.paymentSubscription.create({
      data: {
        transactionId: transaction.id,
        planId: plan.id,
        status: SubscriptionStatus.CREATING,
        totalCount: dto.totalCount,
        metadata: { correlationId: correlationId ?? null },
      },
    });
    try {
      const remote = await this._provider.createSubscription({
        planId: plan.providerPlanId!,
        totalCount: dto.totalCount,
        notes: {
          subscription_ref: local.publicId,
          booking_ref: booking.publicId,
        },
      });
      const result = {
        subscriptionReference: local.publicId,
        status: SubscriptionStatus.CREATED,
        mandateAuthorizationUrl: remote.shortUrl ?? null,
      };
      await this._prisma.$transaction(async (tx) => {
        await tx.paymentSubscription.update({
          where: { id: local.id },
          data: {
            providerSubscriptionId: remote.id,
            status: SubscriptionStatus.CREATED,
            chargeAt: remote.chargeAt ? new Date(remote.chargeAt * 1000) : null,
            version: { increment: 1 },
          },
        });
        await tx.paymentMandate.create({
          data: { subscriptionId: local.id, status: 'PENDING' },
        });
        await this._audit(
          tx,
          'PaymentSubscription',
          local.id,
          'CREATED',
          userId,
          correlationId,
        );
      });
      await this._completeIdempotency(
        userId,
        'create-subscription',
        key,
        result,
        local.id,
      );
      return result;
    } catch (error) {
      await this._prisma.paymentSubscription.update({
        where: { id: local.id },
        data: { status: SubscriptionStatus.FAILED },
      });
      await this._lifecycle.markCheckoutCreationFailed(transaction.id);
      await this._failIdempotency(userId, 'create-subscription', key);
      throw error;
    }
  }
  async changeSubscription(
    userId: string,
    reference: string,
    action: 'pause' | 'resume' | 'cancel',
  ): Promise<void> {
    const subscription = await this._prisma.paymentSubscription.findFirst({
      where: { publicId: reference, transaction: { booking: { userId } } },
    });
    if (!subscription?.providerSubscriptionId) throw new PaymentNotFoundError();
    const target =
      action === 'pause'
        ? SubscriptionStatus.PAUSED
        : action === 'resume'
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.CANCELLED;
    assertSubscriptionTransition(subscription.status, target);
    if (action === 'pause')
      await this._provider.pauseSubscription(
        subscription.providerSubscriptionId,
      );
    else if (action === 'resume')
      await this._provider.resumeSubscription(
        subscription.providerSubscriptionId,
      );
    else
      await this._provider.cancelSubscription(
        subscription.providerSubscriptionId,
      );
    await this._prisma.paymentSubscription.update({
      where: { id: subscription.id },
      data: {
        status: target,
        endedAt: action === 'cancel' ? new Date() : undefined,
        version: { increment: 1 },
      },
    });
  }
  private async _ownedOrder(userId: string, reference: string) {
    const order = await this._prisma.paymentOrder.findFirst({
      where: { publicId: reference, transaction: { booking: { userId } } },
      include: { qrCodes: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) throw new PaymentNotFoundError();
    return order;
  }
  private async _markPaid(
    orderId: string,
    transactionId: string,
    attemptId: string,
    providerPaymentId: string,
  ): Promise<void> {
    await this._lifecycle.markOrderPaid({
      orderId,
      transactionId,
      attemptId,
      providerPaymentId,
    });
  }
  private _hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
  private async _claimIdempotency(
    ownerId: string,
    operation: string,
    key: string,
    requestHash: string,
  ): Promise<Record<string, unknown> | null> {
    if (!/^[\w.-]{16,128}$/.test(key))
      throw new ConflictException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key must contain 16 to 128 safe characters',
      });
    const keyHash = this._hash(key);
    const existing = await this._prisma.paymentIdempotencyKey.findUnique({
      where: { ownerId_operation_keyHash: { ownerId, operation, keyHash } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash)
        throw new IdempotencyConflictError();
      if (existing.status === 'COMPLETED')
        return existing.responseBody as Record<string, unknown>;
      throw new PaymentInProgressError();
    }
    await this._prisma.paymentIdempotencyKey.create({
      data: {
        ownerId,
        operation,
        keyHash,
        requestHash,
        status: 'PROCESSING',
        lockedUntil: new Date(Date.now() + 60_000),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    return null;
  }
  private async _completeIdempotency(
    ownerId: string,
    operation: string,
    key: string,
    response: unknown,
    resourceId: string,
  ): Promise<void> {
    await this._prisma.paymentIdempotencyKey.update({
      where: {
        ownerId_operation_keyHash: {
          ownerId,
          operation,
          keyHash: this._hash(key),
        },
      },
      data: {
        status: 'COMPLETED',
        responseCode: 201,
        responseBody: JSON.parse(
          JSON.stringify(response),
        ) as Prisma.InputJsonValue,
        resourceId,
        lockedUntil: null,
      },
    });
  }
  private async _failIdempotency(
    ownerId: string,
    operation: string,
    key: string,
  ): Promise<void> {
    await this._prisma.paymentIdempotencyKey.updateMany({
      where: { ownerId, operation, keyHash: this._hash(key) },
      data: { status: 'FAILED', lockedUntil: null },
    });
  }
  private async _audit(
    tx: Prisma.TransactionClient,
    type: string,
    id: string,
    action: string,
    actorId: string,
    correlationId?: string,
  ): Promise<void> {
    await tx.paymentAuditLog.create({
      data: {
        aggregateType: type,
        aggregateId: id,
        action,
        actorType: 'USER',
        actorId,
        correlationId,
        metadata: {},
      },
    });
  }
}
