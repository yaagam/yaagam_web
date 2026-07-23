import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { redis } from '../../../../config/redis/redis.config';
import {
  INVALID_OTP,
  OTP_VERIFICATION_IN_PROGRESS,
} from '../../constants/errors.const';
import { RedisOtpService } from './redis-otp.service';

jest.mock('../../../../config/redis/redis.config', () => ({
  redis: {
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    ttl: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

describe('RedisOtpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects duplicate verification attempts for the same OTP session', async () => {
    const redisMock = redis as jest.Mocked<typeof redis>;
    redisMock.set.mockResolvedValueOnce(null);

    const service = new RedisOtpService();

    await expect(
      service.verify({ sessionId: 'session-id', otp: '123456' }),
    ).rejects.toMatchObject({
      message: OTP_VERIFICATION_IN_PROGRESS,
    } satisfies Partial<BadRequestException>);
    expect(redisMock.set.mock.calls).toContainEqual([
      'otp:verify-lock:session-id',
      '1',
      'EX',
      30,
      'NX',
    ]);
    expect(redisMock.get.mock.calls).toHaveLength(0);
  });

  it('returns invalid OTP when the session exists but the OTP is wrong', async () => {
    const redisMock = redis as jest.Mocked<typeof redis>;
    redisMock.set.mockResolvedValueOnce('OK');
    redisMock.get
      .mockResolvedValueOnce(
        JSON.stringify({ userId: 'user-id', resendCount: 0 }),
      )
      .mockResolvedValueOnce(JSON.stringify({ hash: 'otp-hash', attempts: 0 }));
    redisMock.ttl.mockResolvedValue(240);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = new RedisOtpService();

    await expect(
      service.verify({ sessionId: 'session-id', otp: '000000' }),
    ).rejects.toMatchObject({
      message: INVALID_OTP,
    } satisfies Partial<BadRequestException>);
    expect(redisMock.set.mock.calls).toContainEqual([
      'otp:data:session-id',
      JSON.stringify({ hash: 'otp-hash', attempts: 1 }),
      'EX',
      240,
    ]);
    expect(redisMock.del.mock.calls).toContainEqual([
      'otp:verify-lock:session-id',
    ]);
  });
});
