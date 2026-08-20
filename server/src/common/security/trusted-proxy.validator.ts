import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { ITrustedProxyValidator } from './interfaces/trusted-proxy-validator.interface';

@Injectable()
export class TrustedProxyValidator implements ITrustedProxyValidator {
  private readonly _secret: string;
  private readonly _isRequired: boolean;
  private readonly _publicPaths = new Set([
    '/health',
    '/webhooks/razorpay',
    '/auth/meta/webhook',
    '/zoho/oauth/callback',
  ]);

  constructor(private readonly _configService: ConfigService) {
    this._secret =
      this._configService.get<string>('TRUSTED_PROXY_SECRET')?.trim() ?? '';
    this._isRequired =
      this._configService.get<string>('NODE_ENV') === 'production' ||
      this._configService.get<string>('REQUIRE_TRUSTED_PROXY') === 'true';

    if (this._isRequired && !this._secret) {
      throw new ServiceUnavailableException(
        'TRUSTED_PROXY_SECRET is required in this environment',
      );
    }
  }

  assertAllowed(request: Request): void {
    if (
      !this._isRequired ||
      this._isPublicPath(request.originalUrl || request.path)
    )
      return;

    const value = request.header('x-yaagam-proxy-secret')?.trim() ?? '';
    if (!this._matchesSecret(value)) {
      throw new UnauthorizedException('Trusted proxy authentication required');
    }
  }

  private _isPublicPath(path: string): boolean {
    const pathname = path.split(/[?#]/, 1)[0] ?? '';
    const normalizedPath = pathname.replace(/\/+$/g, '') || '/';

    return [...this._publicPaths].some(
      (publicPath) =>
        normalizedPath === publicPath ||
        normalizedPath.endsWith(`/api/v1${publicPath}`),
    );
  }

  private _matchesSecret(value: string): boolean {
    if (!value || !this._secret) return false;

    const actual = Buffer.from(value);
    const expected = Buffer.from(this._secret);

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
