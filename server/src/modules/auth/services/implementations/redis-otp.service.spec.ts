import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { redis } from '../../../../config/redis/redis.config';
import { INVALID_OTP } from '../../constants/errors.const';
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
  it('returns invalid OTP when the session exists but the OTP is wrong', async () => {
    const redisMock = redis as jest.Mocked<typeof redis>;
    redisMock.get
      .mockResolvedValueOnce(
        JSON.stringify({ userId: 'user-id', resendCount: 0 }),
      )
      .mockResolvedValueOnce(JSON.stringify({ hash: 'otp-hash', attempts: 0 }));
    redisMock.ttl.mockResolvedValue(240);
    redisMock.set.mockResolvedValue('OK');
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    const service = new RedisOtpService();

    await expect(
      service.verify({ sessionId: 'session-id', otp: '000000' }),
    ).rejects.toMatchObject<BadRequestException>({
      message: INVALID_OTP,
    });
    expect(redisMock.set.mock.calls).toContainEqual([
      'otp:data:session-id',
      JSON.stringify({ hash: 'otp-hash', attempts: 1 }),
      'EX',
      240,
    ]);
  });
});
