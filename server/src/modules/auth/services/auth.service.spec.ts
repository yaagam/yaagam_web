import { AuthService } from './auth.service';
import { SEND_OTP_JOB } from '../constants/otp-queue.const';

describe('AuthService', () => {
  it('generates an OTP and queues its delivery', async () => {
    const otpService = {
      generate: jest.fn().mockResolvedValue({
        sessionId: 'session-id',
        otp: '123456',
      }),
      verify: jest.fn(),
      resend: jest.fn(),
    };
    const otpQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(
      otpService,
      { generateTokenPair: jest.fn() },
      otpQueue as never,
      {} as never,
    );

    await expect(
      service.sendOtp({ whatsappNumber: '8157988287' }),
    ).resolves.toEqual({ sessionId: 'session-id' });
    expect(otpService.generate).toHaveBeenCalledWith({
      userId: '8157988287',
    });
    expect(otpQueue.add).toHaveBeenCalledWith(
      SEND_OTP_JOB,
      { whatsappNumber: '8157988287', otp: '123456' },
      expect.objectContaining({ jobId: 'session-id', attempts: 3 }),
    );
  });

  it('verifies an OTP using its session ID', async () => {
    const otpService = {
      generate: jest.fn(),
      verify: jest.fn().mockResolvedValue({ userId: '8157988287' }),
      resend: jest.fn(),
    };
    const tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    };
    const prismaService = {
      user: {
        upsert: jest.fn().mockResolvedValue({ id: 'user-id' }),
      },
    };
    const service = new AuthService(
      otpService,
      tokenService,
      {} as never,
      prismaService as never,
    );

    await expect(
      service.verifyOtp({ sessionId: 'session-id', otp: '123456' }),
    ).resolves.toEqual({
      userId: 'user-id',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(otpService.verify).toHaveBeenCalledWith({
      sessionId: 'session-id',
      otp: '123456',
    });
    expect(prismaService.user.upsert).toHaveBeenCalledWith({
      where: { whatsappNumber: '8157988287' },
      update: { isWhatsappVerified: true },
      create: {
        whatsappNumber: '8157988287',
        isWhatsappVerified: true,
      },
      select: { id: true },
    });
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith({
      userId: 'user-id',
    });
  });
});
