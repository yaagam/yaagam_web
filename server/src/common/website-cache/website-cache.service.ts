import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IWebsiteCacheService,
  WebsiteCacheEntity,
} from './website-cache.service.interface';

const REQUEST_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [0, 250, 750] as const;

@Injectable()
export class WebsiteCacheService implements IWebsiteCacheService {
  private readonly _logger = new Logger(WebsiteCacheService.name);

  constructor(private readonly _configService: ConfigService) {}

  async invalidate(
    entity: WebsiteCacheEntity,
    ...requestedSlugs: string[]
  ): Promise<void> {
    const websiteUrl = this._configService.get<string>('WEBSITE_URL')?.trim();
    const secret = this._configService
      .get<string>('CACHE_REVALIDATION_SECRET')
      ?.trim();

    if (!websiteUrl || !secret) {
      this._logger.warn(
        'Website cache invalidation skipped: WEBSITE_URL or CACHE_REVALIDATION_SECRET is missing.',
      );
      return;
    }

    const slugs = [
      ...new Set(requestedSlugs.map((slug) => slug.trim())),
    ].filter(Boolean);
    const payloads = slugs.length
      ? slugs.map((slug) => ({ entity, slug }))
      : [{ entity }];

    for (const payload of payloads) {
      await this._invalidateWithRetry(websiteUrl, secret, payload);
    }
  }

  private async _invalidateWithRetry(
    websiteUrl: string,
    secret: string,
    payload: { entity: WebsiteCacheEntity; slug?: string },
  ): Promise<void> {
    const endpoint = new URL('/api/cache/revalidate', websiteUrl);
    let lastError: unknown;

    for (const delayMs of RETRY_DELAYS_MS) {
      if (delayMs) await this._delay(delayMs);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${secret}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (response.ok) return;
        lastError = new Error(`Website returned HTTP ${response.status}.`);

        if (response.status < 500 && response.status !== 429) break;
      } catch (error) {
        lastError = error;
      }
    }

    this._logger.error(
      `Website cache invalidation failed for ${payload.entity}${payload.slug ? `:${payload.slug}` : ''}.`,
      lastError instanceof Error ? lastError.stack : String(lastError),
    );
  }

  private _delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
