import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TRUSTED_PROXY_VALIDATOR } from './constants/security-token.const';
import type { ITrustedProxyValidator } from './interfaces/trusted-proxy-validator.interface';

@Injectable()
export class TrustedProxyMiddleware implements NestMiddleware {
  constructor(
    @Inject(TRUSTED_PROXY_VALIDATOR)
    private readonly _validator: ITrustedProxyValidator,
  ) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    this._validator.assertAllowed(request);
    next();
  }
}
