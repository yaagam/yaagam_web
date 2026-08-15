import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { redis } from '../../../../config/redis/redis.config';
import {
  INVALID_OTP,
  OTP_VERIFICATION_IN_PROGRESS,
} from '../../constants/errors.const';
import { RedisOtpService } from './redis-otp.service';

jest.mock('../../../../config/redis/redis.config', () => ({
  redis: {
    del: jest.fn(),
    eval: jest.fn(),
    get: jest.fn(),
    mget: jest.fn(),
    multi: jest.fn(),
    set: jest.fn(),
    ttl: jest.fn(),
  },
}));

describe('RedisOtpService', () => {
  const secret = 'otp-test-secret-that-is-at-least-32-characters';
  const config = {
    get: jest.fn().mockReturnValue(undefined),
    getOrThrow: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    (redis.eval as jest.Mock).mockResolvedValue([1, 900]);
  });

  it('rejects duplicate verification attempts for the same OTP session', async () => {
    (redis.set as jest.Mock).mockResolvedValueOnce(null);
    const service = new RedisOtpService(config);

    await expect(
      service.verify({
        sessionId: 'session-id',
        otp: '123456',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toMatchObject({
      message: OTP_VERIFICATION_IN_PROGRESS,
    } satisfies Partial<BadRequestException>);
  });

  it('increments attempts when the OTP is wrong', async () => {
    const digest = createHmac('sha256', secret)
      .update('session-id:123456')
      .digest('hex');
    (redis.set as jest.Mock).mockResolvedValueOnce('OK');
    (redis.mget as jest.Mock).mockResolvedValueOnce([
      JSON.stringify({ userId: 'user-id', createdAt: Date.now() }),
      JSON.stringify({ digest, attempts: 0 }),
    ]);
    (redis.ttl as jest.Mock).mockResolvedValue(240);
    const service = new RedisOtpService(config);

    await expect(
      service.verify({
        sessionId: 'session-id',
        otp: '000000',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toMatchObject({ message: INVALID_OTP });
    expect((redis.set as jest.Mock).mock.calls).toContainEqual([
      'otp:data:session-id',
      JSON.stringify({ digest, attempts: 1 }),
      'EX',
      240,
    ]);
  });

  it('returns 429 when an IP verification limit is exceeded', async () => {
    (redis.eval as jest.Mock).mockResolvedValueOnce([31, 120]);
    const service = new RedisOtpService(config);

    await expect(
      service.verify({
        sessionId: 'session-id',
        otp: '123456',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it('does not consume send quotas during the resend cooldown', async () => {
    (redis.ttl as jest.Mock).mockResolvedValueOnce(42);
    const service = new RedisOtpService(config);

    await expect(
      service.generate({
        userId: '+918157988287',
        rateLimitId: '+918157988287',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
      response: expect.objectContaining({
        code: 'OTP_RESEND_COOLDOWN',
        retryAfterSeconds: 42,
      }),
    });
    expect(redis.eval).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });
});
