import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { MetaWebhookService } from './meta-webhook.service';

describe('MetaWebhookService', () => {
  const verifyToken = 'verify-token-that-is-longer-than-32-characters';
  const appSecret = 'meta-app-secret';
  const config = {
    getOrThrow: (key: string) =>
      key === 'META_WEBHOOK_VERIFY_TOKEN' ? verifyToken : appSecret,
  } as ConfigService;

  it('returns Meta challenge for the configured verification token', () => {
    const service = new MetaWebhookService(config);
    expect(service.verifyChallenge('subscribe', verifyToken, 'challenge')).toBe(
      'challenge',
    );
  });

  it('rejects an invalid verification token', () => {
    const service = new MetaWebhookService(config);
    expect(() =>
      service.verifyChallenge('subscribe', 'incorrect-token', 'challenge'),
    ).toThrow(ForbiddenException);
  });

  it('accepts a valid signed raw webhook body', () => {
    const service = new MetaWebhookService(config);
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const signature = `sha256=${createHmac('sha256', appSecret)
      .update(body)
      .digest('hex')}`;

    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });

  it('rejects a signature created for different bytes', () => {
    const service = new MetaWebhookService(config);
    const signature = `sha256=${createHmac('sha256', appSecret)
      .update(Buffer.from('{}'))
      .digest('hex')}`;

    expect(() =>
      service.verifySignature(Buffer.from('{"changed":true}'), signature),
    ).toThrow(UnauthorizedException);
  });
});
