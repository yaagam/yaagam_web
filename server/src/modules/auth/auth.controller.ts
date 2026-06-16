import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { SendOtpRequestDto } from './dtos/send-otp.dto';
import { VerifyOtpRequestDto } from './dtos/verify-otp.dto';
import { AuthService } from './services/auth.service';
import {
  INVALID_REFRESH_TOKEN,
  INVALID_SESSION,
} from './constants/errors.const';
import type {
  RefreshTokenOutput,
  VerifyOtpOutput,
} from './services/interfaces/auth.service.interface';
import type { AuthRole } from './services/interfaces/token.service.interface';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

interface VerifyOtpResponse {
  userId: string;
  role: AuthRole;
}

type RefreshResponse = VerifyOtpResponse;

@Controller('auth')
export class AuthController {
  private readonly otpSessionCookie: string;
  private readonly verifyOtpCookiePath: string;
  private readonly otpSessionMaxAgeMs: number;
  private readonly accessTokenCookie: string;
  private readonly accessTokenCookieMaxAgeMs: number;
  private readonly refreshTokenCookie: string;
  private readonly refreshTokenCookieMaxAgeMs: number;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.otpSessionCookie =
      configService.getOrThrow<string>('OTP_SESSION_COOKIE');
    this.verifyOtpCookiePath = configService.getOrThrow<string>(
      'VERIFY_OTP_COOKIE_PATH',
    );
    this.otpSessionMaxAgeMs = Number(
      configService.getOrThrow<string>('OTP_SESSION_MAX_AGE_MS'),
    );
    this.accessTokenCookie = configService.getOrThrow<string>(
      'ACCESS_TOKEN_COOKIE',
    );
    this.accessTokenCookieMaxAgeMs = Number(
      configService.getOrThrow<string>('ACCESS_TOKEN_COOKIE_MAX_AGE_MS'),
    );
    this.refreshTokenCookie = configService.getOrThrow<string>(
      'REFRESH_TOKEN_COOKIE',
    );
    this.refreshTokenCookieMaxAgeMs = Number(
      configService.getOrThrow<string>('REFRESH_TOKEN_COOKIE_MAX_AGE_MS'),
    );

    if (
      !Number.isFinite(this.otpSessionMaxAgeMs) ||
      !Number.isFinite(this.accessTokenCookieMaxAgeMs) ||
      !Number.isFinite(this.refreshTokenCookieMaxAgeMs)
    ) {
      throw new Error('Cookie max-age values must be numbers');
    }
  }

  private isSecureCookieRequired(cookieName: string): boolean {
    return (
      cookieName.startsWith('__Host-') || cookieName.startsWith('__Secure-')
    );
  }

  private isCookieSecure(cookieName: string): boolean {
    return (
      process.env.NODE_ENV === 'production' ||
      this.isSecureCookieRequired(cookieName)
    );
  }

  private authCookieOptions(cookieName: string) {
    return {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      secure: this.isCookieSecure(cookieName),
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(this.accessTokenCookie, accessToken, {
      ...this.authCookieOptions(this.accessTokenCookie),
      maxAge: this.accessTokenCookieMaxAgeMs,
    });
    res.cookie(this.refreshTokenCookie, refreshToken, {
      ...this.authCookieOptions(this.refreshTokenCookie),
      maxAge: this.refreshTokenCookieMaxAgeMs,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(this.accessTokenCookie, {
      ...this.authCookieOptions(this.accessTokenCookie),
    });
    res.clearCookie(this.refreshTokenCookie, {
      ...this.authCookieOptions(this.refreshTokenCookie),
    });
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendOtp(
    @Body() dto: SendOtpRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { sessionId } = await this.authService.sendOtp(dto);

    res.cookie(this.otpSessionCookie, sessionId, {
      httpOnly: true,
      maxAge: this.otpSessionMaxAgeMs,
      path: this.verifyOtpCookiePath,
      sameSite: 'lax',
      secure: this.isCookieSecure(this.otpSessionCookie),
    });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpRequestDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyOtpResponse> {
    const sessionId = req.cookies?.[this.otpSessionCookie];

    if (!sessionId) {
      throw new BadRequestException(INVALID_SESSION);
    }

    const authResult: VerifyOtpOutput = await this.authService.verifyOtp({
      sessionId,
      otp: dto.otp,
    });
    const { userId, role, accessToken, refreshToken } = authResult;

    res.clearCookie(this.otpSessionCookie, {
      httpOnly: true,
      path: this.verifyOtpCookiePath,
      sameSite: 'lax',
      secure: this.isCookieSecure(this.otpSessionCookie),
    });

    this.setAuthCookies(res, accessToken, refreshToken);

    return { userId, role };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const refreshToken = req.cookies?.[this.refreshTokenCookie];

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    const refreshResult: RefreshTokenOutput =
      await this.authService.refreshToken({
        refreshToken,
      });

    this.setAuthCookies(
      res,
      refreshResult.accessToken,
      refreshResult.refreshToken,
    );

    return { userId: refreshResult.userId, role: refreshResult.role };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[this.refreshTokenCookie];

    if (refreshToken) {
      await this.authService.logout({ refreshToken });
    }

    this.clearAuthCookies(res);
  }

  @Post('logout-all-devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAllDevices(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[this.refreshTokenCookie];

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    await this.authService.logoutAllDevices({ refreshToken });
    this.clearAuthCookies(res);
  }
}
