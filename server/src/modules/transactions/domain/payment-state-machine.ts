import { ConflictException } from '@nestjs/common';
import { PaymentOrderStatus, SubscriptionStatus } from '@prisma/client';
const ORDER_TRANSITIONS: Record<
  PaymentOrderStatus,
  readonly PaymentOrderStatus[]
> = {
  CREATING: ['CREATED', 'FAILED'],
  CREATED: ['ATTEMPTED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED'],
  ATTEMPTED: ['PAID', 'CANCELLED', 'EXPIRED', 'FAILED'],
  PAID: [],
  CANCELLED: [],
  EXPIRED: [],
  FAILED: [],
};
const SUBSCRIPTION_TRANSITIONS: Record<
  SubscriptionStatus,
  readonly SubscriptionStatus[]
> = {
  CREATING: ['CREATED', 'FAILED'],
  CREATED: ['AUTHENTICATED', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'FAILED'],
  AUTHENTICATED: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'FAILED'],
  ACTIVE: ['PAUSED', 'HALTED', 'CANCELLED', 'COMPLETED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  HALTED: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
  CANCELLED: [],
  COMPLETED: [],
  EXPIRED: [],
  FAILED: [],
};
export function assertOrderTransition(
  from: PaymentOrderStatus,
  to: PaymentOrderStatus,
): void {
  if (!ORDER_TRANSITIONS[from].includes(to))
    throw new ConflictException({
      code: 'INVALID_PAYMENT_TRANSITION',
      message: `Cannot transition payment from ${from} to ${to}`,
    });
}
export function assertSubscriptionTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
): void {
  if (!SUBSCRIPTION_TRANSITIONS[from].includes(to))
    throw new ConflictException({
      code: 'INVALID_SUBSCRIPTION_TRANSITION',
      message: `Cannot transition subscription from ${from} to ${to}`,
    });
}
