import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IMetaWebhookService } from '../interfaces/meta-webhook.service.interface';

@Injectable()
export class MetaWebhookService implements IMetaWebhookService {
  private readonly _verifyToken: string;
  private readonly _appSecret: string;

  constructor(private readonly _configService: ConfigService) {
    this._verifyToken = this._requiredConfig('META_WEBHOOK_VERIFY_TOKEN');
    this._appSecret = this._requiredConfig('META_APP_SECRET');
    if (this._verifyToken.length < 32) {
      throw new Error(
        'META_WEBHOOK_VERIFY_TOKEN must contain at least 32 characters',
      );
    }
  }

  verifyChallenge(mode: string, token: string, challenge: string): string {
    if (
      mode !== 'subscribe' ||
      !this._constantTimeMatch(token, this._verifyToken)
    ) {
      throw new ForbiddenException('Meta webhook verification failed');
    }
    return challenge;
  }

  verifySignature(rawBody: Buffer, signature?: string): void {
    if (!signature?.startsWith('sha256=')) {
      throw new UnauthorizedException('Missing Meta webhook signature');
    }
    const suppliedHex = signature.slice('sha256='.length);
    if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) {
      throw new UnauthorizedException('Invalid Meta webhook signature');
    }

    const expected = createHmac('sha256', this._appSecret)
      .update(rawBody)
      .digest();
    const supplied = Buffer.from(suppliedHex, 'hex');
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      throw new UnauthorizedException('Invalid Meta webhook signature');
    }
  }

  private _constantTimeMatch(value: string, expected: string): boolean {
    const actualBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private _requiredConfig(key: string): string {
    const value = this._configService.getOrThrow<string>(key).trim();
    if (!value) throw new Error(`${key} must not be empty`);
    return value;
  }
}
