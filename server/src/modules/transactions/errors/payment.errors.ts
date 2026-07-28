import { ConflictException, NotFoundException } from '@nestjs/common';
export class PaymentNotFoundError extends NotFoundException {
  constructor() {
    super({ code: 'PAYMENT_NOT_FOUND', message: 'Payment was not found' });
  }
}
export class IdempotencyConflictError extends ConflictException {
  constructor() {
    super({
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'The idempotency key was already used with another request',
    });
  }
}
export class PaymentInProgressError extends ConflictException {
  constructor() {
    super({
      code: 'PAYMENT_IN_PROGRESS',
      message: 'An equivalent payment request is already in progress',
    });
  }
}
