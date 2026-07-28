import { ConflictException } from '@nestjs/common';
import { PaymentOrderStatus, SubscriptionStatus } from '@prisma/client';
import {
  assertOrderTransition,
  assertSubscriptionTransition,
} from './payment-state-machine';
describe('payment state machines', () => {
  it('allows explicit forward transitions', () => {
    expect(() =>
      assertOrderTransition(
        PaymentOrderStatus.CREATED,
        PaymentOrderStatus.PAID,
      ),
    ).not.toThrow();
    expect(() =>
      assertSubscriptionTransition(
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.PAUSED,
      ),
    ).not.toThrow();
  });
  it('rejects terminal and invalid transitions', () => {
    expect(() =>
      assertOrderTransition(
        PaymentOrderStatus.PAID,
        PaymentOrderStatus.CREATED,
      ),
    ).toThrow(ConflictException);
    expect(() =>
      assertSubscriptionTransition(
        SubscriptionStatus.CANCELLED,
        SubscriptionStatus.ACTIVE,
      ),
    ).toThrow(ConflictException);
  });
});
