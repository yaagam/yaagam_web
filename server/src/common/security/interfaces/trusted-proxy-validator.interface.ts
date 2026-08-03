import type { Request } from 'express';

export interface ITrustedProxyValidator {
  assertAllowed(request: Request): void;
}
