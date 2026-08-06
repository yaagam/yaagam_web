import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { TrustedProxyValidator } from './trusted-proxy.validator';

describe('TrustedProxyValidator', () => {
  function createValidator(values: Record<string, string | undefined>) {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    };

    return new TrustedProxyValidator(configService as unknown as ConfigService);
  }

  it('rejects production startup without a proxy secret', () => {
    expect(() => createValidator({ NODE_ENV: 'production' })).toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects direct API requests without the proxy credential', () => {
    const validator = createValidator({
      NODE_ENV: 'production',
      TRUSTED_PROXY_SECRET: 'strong-secret',
    });
    const request = {
      path: '/api/v1/temples',
      header: jest.fn().mockReturnValue(undefined),
    };

    expect(() => validator.assertAllowed(request as never)).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts the configured proxy credential', () => {
    const validator = createValidator({
      NODE_ENV: 'production',
      TRUSTED_PROXY_SECRET: 'strong-secret',
    });
    const request = {
      path: '/api/v1/temples',
      header: jest.fn().mockReturnValue('strong-secret'),
    };

    expect(() => validator.assertAllowed(request as never)).not.toThrow();
  });

  it.each([
    '/api/v1/health',
    '/api/v1/webhooks/razorpay',
    '/api/v1/auth/meta/webhook',
    '/api/v1/zoho/oauth/callback',
  ])('keeps signed infrastructure endpoint %s reachable', (path) => {
    const validator = createValidator({
      NODE_ENV: 'production',
      TRUSTED_PROXY_SECRET: 'strong-secret',
    });
    const request = { path, header: jest.fn() };

    expect(() => validator.assertAllowed(request as never)).not.toThrow();
  });
});
