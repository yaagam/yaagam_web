import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { SendOtpRequestDto } from './dtos/send-otp.dto';
import { VerifyOtpRequestDto } from './dtos/verify-otp.dto';
import { AuthService } from './services/auth.service';
import { INVALID_SESSION } from './constants/errors.const';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

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
      secure: process.env.NODE_ENV === 'production',
    });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpRequestDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.[this.otpSessionCookie];

    if (!sessionId) {
      throw new BadRequestException(INVALID_SESSION);
    }

    const { userId, accessToken, refreshToken } =
      await this.authService.verifyOtp({
        sessionId,
        otp: dto.otp,
      });

    res.clearCookie(this.otpSessionCookie, {
      httpOnly: true,
      path: this.verifyOtpCookiePath,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const authCookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    res.cookie(this.accessTokenCookie, accessToken, {
      ...authCookieOptions,
      maxAge: this.accessTokenCookieMaxAgeMs,
    });
    res.cookie(this.refreshTokenCookie, refreshToken, {
      ...authCookieOptions,
      maxAge: this.refreshTokenCookieMaxAgeMs,
    });

    return { userId };
  }
}
