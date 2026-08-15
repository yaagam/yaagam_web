import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AUTH_SERVICE } from './constants/service-tokens.const';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    sendOtp: jest.fn().mockResolvedValue({
      sessionId: 'session-id',
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    }),
    verifyOtp: jest.fn().mockResolvedValue({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    }),
    refreshToken: jest.fn().mockResolvedValue({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    logoutAllDevices: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'COOKIE_DOMAIN') {
        return undefined;
      }

      return undefined;
    }),
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
        { provide: AUTH_SERVICE, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queues an OTP for the supplied WhatsApp number', async () => {
    const request = { ip: '127.0.0.1' };
    const response = { cookie: jest.fn() };

    await expect(
      controller.sendOtp(
        { whatsappNumber: '8157988287' },
        request as never,
        response as never,
      ),
    ).resolves.toEqual({
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    });
    expect(authService.sendOtp).toHaveBeenCalledWith({
      whatsappNumber: '8157988287',
      ipAddress: '127.0.0.1',
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
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
    });
    expect(authService.verifyOtp).toHaveBeenCalledWith({
      sessionId: 'session-id',
      otp: '123456',
      ipAddress: 'unknown',
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

  it('sets secure auth cookies when names use reserved secure prefixes', async () => {
    const prefixedConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_DOMAIN') {
          return 'yaagam.in';
        }

        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          OTP_SESSION_COOKIE: '__Otp-session-id',
          VERIFY_OTP_COOKIE_PATH: '/api/v1/auth/verify-otp',
          OTP_SESSION_MAX_AGE_MS: '900000',
          ACCESS_TOKEN_COOKIE: '__Host-access',
          REFRESH_TOKEN_COOKIE: '__Host-refresh',
          ACCESS_TOKEN_COOKIE_MAX_AGE_MS: '900000',
          REFRESH_TOKEN_COOKIE_MAX_AGE_MS: '604800000',
        };

        return config[key];
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AUTH_SERVICE, useValue: authService },
        { provide: ConfigService, useValue: prefixedConfigService },
      ],
    }).compile();
    const prefixedController = module.get<AuthController>(AuthController);
    const request = { cookies: { '__Otp-session-id': 'session-id' } };
    const response = { clearCookie: jest.fn(), cookie: jest.fn() };

    await prefixedController.verifyOtp(
      { otp: '123456' },
      request as never,
      response as never,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-access',
      'access-token',
      expect.objectContaining({
        path: '/',
        secure: true,
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-refresh',
      'refresh-token',
      expect.objectContaining({
        path: '/',
        secure: true,
      }),
    );
  });

  it('adds the configured cookie domain for normal cookie names', async () => {
    const domainConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_DOMAIN') {
          return 'yaagam.in';
        }

        return undefined;
      }),
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AUTH_SERVICE, useValue: authService },
        { provide: ConfigService, useValue: domainConfigService },
      ],
    }).compile();
    const domainController = module.get<AuthController>(AuthController);
    const request = { cookies: { otp_session_id: 'session-id' } };
    const response = { clearCookie: jest.fn(), cookie: jest.fn() };

    await domainController.verifyOtp(
      { otp: '123456' },
      request as never,
      response as never,
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      'otp_session_id',
      expect.objectContaining({ domain: 'yaagam.in' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({ domain: 'yaagam.in' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ domain: 'yaagam.in' }),
    );
  });
  it('sets cross-site secure cookies on Railway without NODE_ENV production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT;
    const request = { cookies: { otp_session_id: 'session-id' } };
    const response = { clearCookie: jest.fn(), cookie: jest.fn() };

    delete process.env.NODE_ENV;
    process.env.RAILWAY_ENVIRONMENT = 'production';

    try {
      await controller.verifyOtp(
        { otp: '123456' },
        request as never,
        response as never,
      );
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }

      if (originalRailwayEnvironment === undefined) {
        delete process.env.RAILWAY_ENVIRONMENT;
      } else {
        process.env.RAILWAY_ENVIRONMENT = originalRailwayEnvironment;
      }
    }

    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({
        sameSite: 'none',
        secure: true,
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({
        sameSite: 'none',
        secure: true,
      }),
    );
  });
  it('rotates tokens using the refresh cookie', async () => {
    const request = { cookies: { refresh_token: 'old-refresh-token' } };
    const response = { cookie: jest.fn() };

    await expect(
      controller.refresh(request as never, response as never),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
    });
    expect(authService.refreshToken).toHaveBeenCalledWith({
      refreshToken: 'old-refresh-token',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 900000,
        path: '/',
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 604800000,
        path: '/',
      }),
    );
  });
  it('does not overwrite the refresh cookie for access-only grace refreshes', async () => {
    authService.refreshToken.mockResolvedValueOnce({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
      accessToken: 'grace-access-token',
    });
    const request = { cookies: { refresh_token: 'old-refresh-token' } };
    const response = { cookie: jest.fn() };

    await expect(
      controller.refresh(request as never, response as never),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '8157988287',
      role: 'user',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'grace-access-token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 900000,
        path: '/',
      }),
    );
    expect(response.cookie).not.toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('revokes the current session and clears auth cookies on logout', async () => {
    const request = { cookies: { refresh_token: 'refresh-token' } };
    const response = { clearCookie: jest.fn() };

    await expect(
      controller.logout(request as never, response as never),
    ).resolves.toBeUndefined();
    expect(authService.logout).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });

  it('revokes all user sessions and clears auth cookies on logout all devices', async () => {
    const request = { cookies: { refresh_token: 'refresh-token' } };
    const response = { clearCookie: jest.fn() };

    await expect(
      controller.logoutAllDevices(request as never, response as never),
    ).resolves.toBeUndefined();
    expect(authService.logoutAllDevices).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });
});
