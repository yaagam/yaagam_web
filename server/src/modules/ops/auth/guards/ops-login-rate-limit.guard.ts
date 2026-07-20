import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { OPS_RATE_LIMITED } from '../constants/errors.const';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class OpsLoginRateLimitGuard implements CanActivate {
  private readonly _buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly _configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const windowMs = Number(
      this._configService.get<string>('OPS_LOGIN_RATE_LIMIT_WINDOW_MS') ??
        60_000,
    );
    const max = Number(
      this._configService.get<string>('OPS_LOGIN_RATE_LIMIT_MAX') ?? 10,
    );
    const key = `${request.ip ?? 'unknown'}:${this._getUsername(request)}`;
    const now = Date.now();
    const bucket = this._buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this._buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      throw new HttpException(OPS_RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private _getUsername(request: Request): string {
    const body = request.body as { username?: unknown } | undefined;
    const username = body?.username;

    return typeof username === 'string'
      ? username.trim().toLowerCase()
      : 'unknown';
  }
}
