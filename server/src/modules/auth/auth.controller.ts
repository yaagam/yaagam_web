import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { SendOtpRequestDto } from './dtos/send-otp.dto';
import { VerifyOtpRequestDto } from './dtos/verify-otp.dto';
import {
  INVALID_REFRESH_TOKEN,
  INVALID_SESSION,
} from './constants/errors.const';
import type {
  IAuthService,
  RefreshTokenOutput,
  VerifyOtpOutput,
} from './services/interfaces/auth.service.interface';
import type { AuthRole } from './services/interfaces/token.service.interface';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import {
  SEND_OTP,
  TOKEN_ROTATED,
  VERIFY_OTP,
} from './constants/success-messages.const';
import { AUTH_SERVICE } from './constants/service-tokens.const';

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
  private readonly _otpSessionCookie: string;
  private readonly _verifyOtpCookiePath: string;
  private readonly _otpSessionMaxAgeMs: number;
  private readonly _accessTokenCookie: string;
  private readonly _accessTokenCookieMaxAgeMs: number;
  private readonly _refreshTokenCookie: string;
  private readonly _refreshTokenCookieMaxAgeMs: number;

  constructor(
    @Inject(AUTH_SERVICE)
    private readonly _authService: IAuthService,
    configService: ConfigService,
  ) {
    this._otpSessionCookie =
      configService.getOrThrow<string>('OTP_SESSION_COOKIE');
    this._verifyOtpCookiePath = configService.getOrThrow<string>(
      'VERIFY_OTP_COOKIE_PATH',
    );
    this._otpSessionMaxAgeMs = Number(
      configService.getOrThrow<string>('OTP_SESSION_MAX_AGE_MS'),
    );
    this._accessTokenCookie = configService.getOrThrow<string>(
      'ACCESS_TOKEN_COOKIE',
    );
    this._accessTokenCookieMaxAgeMs = Number(
      configService.getOrThrow<string>('ACCESS_TOKEN_COOKIE_MAX_AGE_MS'),
    );
    this._refreshTokenCookie = configService.getOrThrow<string>(
      'REFRESH_TOKEN_COOKIE',
    );
    this._refreshTokenCookieMaxAgeMs = Number(
      configService.getOrThrow<string>('REFRESH_TOKEN_COOKIE_MAX_AGE_MS'),
    );

    if (
      !Number.isFinite(this._otpSessionMaxAgeMs) ||
      !Number.isFinite(this._accessTokenCookieMaxAgeMs) ||
      !Number.isFinite(this._refreshTokenCookieMaxAgeMs)
    ) {
      throw new Error('Cookie max-age values must be numbers');
    }
  }

  private _isSecureCookieRequired(cookieName: string): boolean {
    return (
      cookieName.startsWith('__Host-') || cookieName.startsWith('__Secure-')
    );
  }

  private _isCookieSecure(cookieName: string): boolean {
    return (
      process.env.NODE_ENV === 'production' ||
      this._isSecureCookieRequired(cookieName)
    );
  }

  private _cookieSameSite(): CookieOptions['sameSite'] {
    return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
  }

  private _authCookieOptions(cookieName: string) {
    return {
      httpOnly: true,
      path: '/',
      sameSite: this._cookieSameSite(),
      secure: this._isCookieSecure(cookieName),
    };
  }

  private _setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(this._accessTokenCookie, accessToken, {
      ...this._authCookieOptions(this._accessTokenCookie),
      maxAge: this._accessTokenCookieMaxAgeMs,
    });
    res.cookie(this._refreshTokenCookie, refreshToken, {
      ...this._authCookieOptions(this._refreshTokenCookie),
      maxAge: this._refreshTokenCookieMaxAgeMs,
    });
  }

  private _clearAuthCookies(res: Response): void {
    res.clearCookie(this._accessTokenCookie, {
      ...this._authCookieOptions(this._accessTokenCookie),
    });
    res.clearCookie(this._refreshTokenCookie, {
      ...this._authCookieOptions(this._refreshTokenCookie),
    });
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  @ResponseMessage(SEND_OTP)
  async sendOtp(
    @Body() dto: SendOtpRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { sessionId } = await this._authService.sendOtp(dto);

    res.cookie(this._otpSessionCookie, sessionId, {
      httpOnly: true,
      maxAge: this._otpSessionMaxAgeMs,
      path: this._verifyOtpCookiePath,
      sameSite: this._cookieSameSite(),
      secure: this._isCookieSecure(this._otpSessionCookie),
    });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(VERIFY_OTP)
  async verifyOtp(
    @Body() dto: VerifyOtpRequestDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyOtpResponse> {
    const sessionId = req.cookies?.[this._otpSessionCookie];

    if (!sessionId) {
      throw new BadRequestException(INVALID_SESSION);
    }

    const authResult: VerifyOtpOutput = await this._authService.verifyOtp({
      sessionId,
      otp: dto.otp,
    });
    const { userId, role, accessToken, refreshToken } = authResult;

    res.clearCookie(this._otpSessionCookie, {
      httpOnly: true,
      path: this._verifyOtpCookiePath,
      sameSite: this._cookieSameSite(),
      secure: this._isCookieSecure(this._otpSessionCookie),
    });

    this._setAuthCookies(res, accessToken, refreshToken);

    return { userId, role };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(TOKEN_ROTATED)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const refreshToken = req.cookies?.[this._refreshTokenCookie];

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    const refreshResult: RefreshTokenOutput =
      await this._authService.refreshToken({
        refreshToken,
      });

    this._setAuthCookies(
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
    const refreshToken = req.cookies?.[this._refreshTokenCookie];

    if (refreshToken) {
      await this._authService.logout({ refreshToken });
    }

    this._clearAuthCookies(res);
  }

  @Post('logout-all-devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAllDevices(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[this._refreshTokenCookie];

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    await this._authService.logoutAllDevices({ refreshToken });
    this._clearAuthCookies(res);
  }
}
