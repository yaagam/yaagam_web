import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const INTERNAL_IDENTIFIER_KEYS = new Set([
  'id',
  'templeId',
  'poojaId',
  'benefitId',
  'offeringId',
]);

@Injectable()
export class PublicCatalogInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((value) => this._sanitize(value)));
  }

  private _sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this._sanitize(item));
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Date) return value;

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !INTERNAL_IDENTIFIER_KEYS.has(key))
        .map(([key, item]) => [key, this._sanitize(item)]),
    );
  }
}
