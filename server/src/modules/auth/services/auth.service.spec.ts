import { AuthService } from './auth.service';
import { createHmac } from 'crypto';
import {
  INVALID_REFRESH_TOKEN,
  REFRESH_TOKEN_REUSED,
} from '../constants/errors.const';

describe('AuthService', () => {
  const hashRefreshToken = (token: string) =>
    createHmac('sha256', 'refresh-secret').update(token).digest('hex');
  const anyStringMatcher: unknown = expect.any(String);
  const anyDateMatcher: unknown = expect.any(Date);

  interface ServiceMocks {
    otpService?: {
      generate: jest.Mock;
      verify: jest.Mock;
      invalidate: jest.Mock;
    };
    tokenService?: { generateTokenPair: jest.Mock };
    messageService?: { sendOtpMessage: jest.Mock };
    prismaService?: Record<string, unknown>;
    jwtService?: { verifyAsync: jest.Mock };
    configService?: { get: jest.Mock; getOrThrow: jest.Mock };
  }

  function createService({
    otpService = {
      generate: jest.fn(),
      verify: jest.fn(),
      invalidate: jest.fn(),
    },
    tokenService = { generateTokenPair: jest.fn() },
    messageService = { sendOtpMessage: jest.fn() },
    prismaService = { user: {}, session: {} },
    jwtService = { verifyAsync: jest.fn() },
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN_SECONDS: '604800',
        };

        return config[key];
      }),
    },
  }: ServiceMocks = {}) {
    return new AuthService(
      otpService,
      tokenService,
      messageService,
      prismaService as never,
      jwtService as never,
      configService as never,
    );
  }

  it('generates an OTP and sends it through the message service', async () => {
    const otpService = {
      generate: jest.fn().mockResolvedValue({
        sessionId: 'session-id',
        otp: '123456',
      }),
      verify: jest.fn(),
      invalidate: jest.fn(),
    };
    const messageService = {
      sendOtpMessage: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ otpService, messageService });

    await expect(
      service.sendOtp({ whatsappNumber: '8157988287' }),
    ).resolves.toEqual({ sessionId: 'session-id' });
    expect(otpService.generate).toHaveBeenCalledWith({
      userId: '8157988287',
      ipAddress: 'unknown',
    });
    expect(messageService.sendOtpMessage).toHaveBeenCalledWith({
      whatsappNumber: '8157988287',
      otp: '123456',
    });
  });

  it('verifies an OTP using its session ID', async () => {
    const otpService = {
      generate: jest.fn(),
      verify: jest.fn().mockResolvedValue({ userId: '8157988287' }),
      invalidate: jest.fn(),
    };
    const tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    };
    const prismaService = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-id' }),
        update: jest.fn().mockResolvedValue({ id: 'user-id' }),
        create: jest.fn(),
      },
      session: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = createService({
      otpService,
      tokenService,
      prismaService,
    });

    await expect(
      service.verifyOtp({ sessionId: 'session-id', otp: '123456' }),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(otpService.verify).toHaveBeenCalledWith({
      sessionId: 'session-id',
      otp: '123456',
      ipAddress: 'unknown',
    });
    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { whatsappNumber: '8157988287' },
      select: { id: true },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { isWhatsappVerified: true },
      select: { id: true, whatsappNumber: true },
    });
    expect(prismaService.user.create).not.toHaveBeenCalled();
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith({
      userId: 'user-id',
      role: 'user',
      sessionId: anyStringMatcher,
    });
    expect(prismaService.session.create).toHaveBeenCalledWith({
      data: {
        id: anyStringMatcher,
        userId: 'user-id',
        refreshTokenHash: hashRefreshToken('refresh-token'),
        expiresAt: anyDateMatcher,
      },
    });
  });

  it('creates a user when verifying an OTP for a new WhatsApp number', async () => {
    const otpService = {
      generate: jest.fn(),
      verify: jest.fn().mockResolvedValue({ userId: '8157988287' }),
      invalidate: jest.fn(),
    };
    const tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    };
    const prismaService = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'user-id' }),
      },
      session: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = createService({
      otpService,
      tokenService,
      prismaService,
    });

    await expect(
      service.verifyOtp({ sessionId: 'session-id', otp: '123456' }),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        whatsappNumber: '8157988287',
        isWhatsappVerified: true,
        provider: 'WHATSAPP',
      },
      select: { id: true, whatsappNumber: true },
    });
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token by replacing the stored session hash', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId: 'user-id',
        sessionId: 'session-id',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    };
    const prismaService = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-id',
          userId: 'user-id',
          refreshTokenHash: hashRefreshToken('old-refresh-token'),
          expiresAt: new Date(Date.now() + 60_000),
          revoked: false,
          user: { id: 'user-id' },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const tokenService = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
    };
    const service = createService({
      tokenService,
      prismaService,
      jwtService,
    });

    await expect(
      service.refreshToken({ refreshToken: 'old-refresh-token' }),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '',
      role: 'user',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('old-refresh-token', {
      secret: 'refresh-secret',
    });
    expect(prismaService.session.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-id' },
      include: { user: { select: { id: true, whatsappNumber: true } } },
    });
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith({
      userId: 'user-id',
      role: 'user',
      sessionId: 'session-id',
    });
    expect(prismaService.session.update).toHaveBeenCalledWith({
      where: { id: 'session-id' },
      data: {
        refreshTokenHash: hashRefreshToken('new-refresh-token'),
        previousRefreshTokenHash: hashRefreshToken('old-refresh-token'),
        previousRefreshTokenExpiry: anyDateMatcher,
        expiresAt: anyDateMatcher,
      },
    });
  });

  it('revokes the session when a refresh token hash does not match', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId: 'user-id',
        sessionId: 'session-id',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    };
    const prismaService = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-id',
          userId: 'user-id',
          refreshTokenHash: hashRefreshToken('newer-refresh-token'),
          expiresAt: new Date(Date.now() + 60_000),
          revoked: false,
          user: { id: 'user-id' },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = createService({ jwtService, prismaService });

    await expect(
      service.refreshToken({ refreshToken: 'old-refresh-token' }),
    ).rejects.toMatchObject({
      message: REFRESH_TOKEN_REUSED,
    });
    expect(prismaService.session.update).toHaveBeenCalledWith({
      where: { id: 'session-id' },
      data: { revoked: true },
    });
  });

  it('rejects an invalid refresh token before loading a session', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
    };
    const prismaService = {
      session: {
        findUnique: jest.fn(),
      },
    };
    const service = createService({ jwtService, prismaService });

    await expect(
      service.refreshToken({ refreshToken: 'bad-refresh-token' }),
    ).rejects.toMatchObject({
      message: INVALID_REFRESH_TOKEN,
    });
    expect(prismaService.session.findUnique).not.toHaveBeenCalled();
  });

  it('revokes the current session during logout', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId: 'user-id',
        sessionId: 'session-id',
      }),
    };
    const prismaService = {
      session: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService({ jwtService, prismaService });

    await expect(
      service.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toBeUndefined();
    expect(prismaService.session.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-id', userId: 'user-id' },
      data: { revoked: true },
    });
  });

  it('revokes every user session during logout all devices', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId: 'user-id',
        sessionId: 'session-id',
      }),
    };
    const prismaService = {
      session: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const service = createService({ jwtService, prismaService });

    await expect(
      service.logoutAllDevices({ refreshToken: 'refresh-token' }),
    ).resolves.toBeUndefined();
    expect(prismaService.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', revoked: false },
      data: { revoked: true },
    });
  });
});
