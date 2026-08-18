import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  PAYMENT_SERVICE,
} from '../../transactions/constants/payment.const';
import type { IPaymentService } from '../../transactions/interfaces/payment-service.interface';
import type { IPaymentProvider } from '../../transactions/interfaces/payment-provider.interface';
import type { GetOpsSubscriptionsQueryDto } from './get-ops-subscriptions-query.dto';
import type {
  IOpsSubscriptionsService,
  OpsSubscriptionItem,
  PaginatedOpsSubscriptions,
} from './ops-subscriptions.service.interface';

const subscriptionInclude =
  Prisma.validator<Prisma.PaymentSubscriptionInclude>()({
    plan: true,
    mandate: { select: { status: true, updatedAt: true } },
    transaction: {
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, whatsappNumber: true },
            },
            pooja: {
              select: {
                id: true,
                translations: {
                  select: { language: true, name: true },
                },
              },
            },
            temple: {
              select: {
                id: true,
                translations: {
                  select: { language: true, name: true },
                },
              },
            },
          },
        },
        paymentAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    },
    _count: { select: { bookings: true } },
  });

type SubscriptionRecord = Prisma.PaymentSubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

@Injectable()
export class OpsSubscriptionsService implements IOpsSubscriptionsService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(PAYMENT_SERVICE)
    private readonly _paymentService: IPaymentService,
    @Inject(PAYMENT_PROVIDER)
    private readonly _paymentProvider: IPaymentProvider,
  ) {}

  async getSubscriptions(
    query: GetOpsSubscriptionsQueryDto,
  ): Promise<PaginatedOpsSubscriptions> {
    const where = this._createWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [subscriptions, total] = await Promise.all([
      this._prismaService.paymentSubscription.findMany({
        where,
        include: subscriptionInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this._prismaService.paymentSubscription.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);
    return {
      items: await Promise.all(
        subscriptions.map((subscription) =>
          this._createItemWithProviderStatus(subscription),
        ),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async getSubscription(id: string): Promise<OpsSubscriptionItem> {
    const subscription =
      await this._prismaService.paymentSubscription.findUnique({
        where: { id },
        include: subscriptionInclude,
      });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return this._createItemWithProviderStatus(subscription);
  }

  async changeSubscription(
    id: string,
    action: 'pause' | 'resume' | 'cancel',
  ): Promise<OpsSubscriptionItem> {
    const subscription =
      await this._prismaService.paymentSubscription.findUnique({
        where: { id },
        select: {
          publicId: true,
          transaction: {
            select: {
              booking: { select: { userId: true } },
            },
          },
        },
      });
    if (!subscription) throw new NotFoundException('Subscription not found');

    await this._paymentService.changeSubscription(
      subscription.transaction.booking.userId,
      subscription.publicId,
      action,
    );

    const updated =
      await this._prismaService.paymentSubscription.findUniqueOrThrow({
        where: { id },
        include: subscriptionInclude,
      });
    return this._createItemWithProviderStatus(updated);
  }

  private _createWhere(
    query: GetOpsSubscriptionsQueryDto,
  ): Prisma.PaymentSubscriptionWhereInput {
    const search = query.search?.trim();
    return {
      status: query.status,
      ...(search
        ? {
            OR: [
              {
                publicId: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                providerSubscriptionId: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                transaction: {
                  booking: {
                    bookingNumber: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
              {
                transaction: {
                  booking: {
                    bookingWhatsappNumber: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async _createItemWithProviderStatus(
    subscription: SubscriptionRecord,
  ): Promise<OpsSubscriptionItem> {
    if (!subscription.providerSubscriptionId) {
      return this._createItem(subscription, null, null);
    }
    try {
      const provider = await this._paymentProvider.fetchSubscription(
        subscription.providerSubscriptionId,
      );
      return this._createItem(subscription, provider.status, new Date());
    } catch {
      return this._createItem(subscription, null, null);
    }
  }

  private _createItem(
    subscription: SubscriptionRecord,
    providerStatus: string | null,
    providerStatusCheckedAt: Date | null,
  ): OpsSubscriptionItem {
    const booking = subscription.transaction.booking;
    const attempt = subscription.transaction.paymentAttempts[0];
    return {
      id: subscription.id,
      reference: subscription.publicId,
      providerSubscriptionId: subscription.providerSubscriptionId,
      status: subscription.status,
      providerStatus,
      providerStatusCheckedAt,
      autopayMandateStatus: this._autopayStatus(
        providerStatus,
        subscription.mandate?.status ?? 'PENDING',
      ),
      customer: booking.user,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
      },
      pooja: {
        id: booking.pooja?.id ?? '',
        name: this._translatedName(booking.pooja?.translations) ?? 'Pooja',
      },
      temple: {
        id: booking.temple.id,
        name: this._translatedName(booking.temple.translations) ?? 'Temple',
      },
      amount: Number(subscription.plan.amountMinor) / 100,
      currency: subscription.plan.currency,
      paidCount: subscription.paidCount,
      totalCount: subscription.totalCount,
      bookingsCount: subscription._count.bookings,
      nextChargeAt: subscription.chargeAt,
      latestPayment: attempt
        ? {
            status: attempt.status,
            amount: Number(attempt.amountMinor) / 100,
            capturedAt: attempt.capturedAt,
            providerPaymentId: attempt.providerPaymentId,
          }
        : null,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      endedAt: subscription.endedAt,
    };
  }

  private _autopayStatus(
    providerStatus: string | null,
    localMandateStatus: string,
  ): string {
    const normalized = providerStatus?.toUpperCase();
    if (normalized === 'CANCELLED') return 'REVOKED';
    if (normalized === 'COMPLETED' || normalized === 'EXPIRED')
      return 'EXPIRED';
    if (normalized === 'ACTIVE') return 'ACTIVE';
    if (normalized === 'AUTHENTICATED') return 'AUTHENTICATED';
    return localMandateStatus;
  }

  private _translatedName(
    translations:
      | Array<{ language: Language; name: string }>
      | null
      | undefined,
  ): string | null {
    return (
      translations?.find((translation) => translation.language === Language.EN)
        ?.name ??
      translations?.[0]?.name ??
      null
    );
  }
}
