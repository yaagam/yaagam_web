import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    sendOtp: jest.fn().mockResolvedValue({ sessionId: 'session-id' }),
    verifyOtp: jest.fn().mockResolvedValue({
      userId: 'user-id',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        OTP_SESSION_COOKIE: 'otp_session_id',
        VERIFY_OTP_COOKIE_PATH: '/api/v1/auth/verify-otp',
        OTP_SESSION_MAX_AGE_MS: '900000',
        ACCESS_TOKEN_COOKIE: 'access_token',
        REFRESH_TOKEN_COOKIE: 'refresh_token',
        ACCESS_TOKEN_COOKIE_MAX_AGE_MS: '900000',
        REFRESH_TOKEN_COOKIE_MAX_AGE_MS: '604800000',
      };

      return config[key];
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queues an OTP for the supplied WhatsApp number', async () => {
    const response = { cookie: jest.fn() };

    await expect(
      controller.sendOtp({ whatsappNumber: '8157988287' }, response as never),
    ).resolves.toBeUndefined();
    expect(authService.sendOtp).toHaveBeenCalledWith({
      whatsappNumber: '8157988287',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'otp_session_id',
      'session-id',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth/verify-otp',
      }),
    );
  });

  it('reads and clears the session cookie when verifying an OTP', async () => {
    const request = { cookies: { otp_session_id: 'session-id' } };
    const response = { clearCookie: jest.fn(), cookie: jest.fn() };

    await expect(
      controller.verifyOtp(
        { otp: '123456' },
        request as never,
        response as never,
      ),
    ).resolves.toEqual({ userId: 'user-id' });
    expect(authService.verifyOtp).toHaveBeenCalledWith({
      sessionId: 'session-id',
      otp: '123456',
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      'otp_session_id',
      expect.objectContaining({
        path: '/api/v1/auth/verify-otp',
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 900000,
        path: '/',
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 604800000,
        path: '/',
      }),
    );
  });
});
