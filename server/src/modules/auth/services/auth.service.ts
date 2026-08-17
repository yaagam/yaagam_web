import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { AuthProvider } from '@prisma/client';
import type {
  IAuthService,
  LogoutInput,
  RefreshTokenInput,
  RefreshTokenOutput,
  SendOtpInput,
  SendOtpOutput,
  VerifyOtpInput,
  VerifyOtpOutput,
} from './interfaces/auth.service.interface';
import type { IMessageService } from './interfaces/message.service.interface';
import type { IOtpService } from './interfaces/otp.service.interface';
import type { ITokenService } from './interfaces/token.service.interface';
import {
  MESSAGE_SERVICE,
  OTP_SERVICE,
  TOKEN_SERVICE,
} from '../constants/service-tokens.const';
import PrismaService from '../../../prisma/prisma.service';
import {
  INVALID_REFRESH_TOKEN,
  REFRESH_TOKEN_REUSED,
} from '../constants/errors.const';

const CUSTOMER_AUTH_ROLE = 'user' as const;
const REFRESH_TOKEN_REUSE_GRACE_MS = 30_000;

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  exp?: number;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(OTP_SERVICE)
    private readonly _otpService: IOtpService,
    @Inject(TOKEN_SERVICE)
    private readonly _tokenService: ITokenService,
    @Inject(MESSAGE_SERVICE)
    private readonly _messageService: IMessageService,
    private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  private _getRefreshFallbackTtlSeconds(): number {
    const ttl = Number(
      this._configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS'),
    );

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('JWT refresh expiry value must be a positive number');
    }

    return ttl;
  }

  private async _verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this._jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this._configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (!payload.userId || !payload.sessionId) {
        throw new Error('Missing refresh token session payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }
  }

  private _getRefreshTokenHash(refreshToken: string): string {
    return createHmac(
      'sha256',
      this._configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(refreshToken)
      .digest('hex');
  }

  private _isRefreshTokenHashMatch(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const incomingHash = this._getRefreshTokenHash(refreshToken);
    const incoming = Buffer.from(incomingHash, 'hex');
    const stored = Buffer.from(storedHash, 'hex');

    return (
      incoming.length === stored.length && timingSafeEqual(incoming, stored)
    );
  }

  private _getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this._getRefreshFallbackTtlSeconds() * 1000);
  }

  private _getPreviousRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_REUSE_GRACE_MS);
  }

  private _getAccessTokenTtlSeconds(): number {
    const ttl = Number(
      this._configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
    );

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('JWT access expiry value must be a positive number');
    }

    return ttl;
  }

  private async _createAccessToken(userId: string): Promise<string> {
    return this._jwtService.signAsync(
      { userId, role: CUSTOMER_AUTH_ROLE },
      {
        secret: this._configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this._getAccessTokenTtlSeconds(),
      },
    );
  }

  private async _createSessionTokenPair(userId: string) {
    const sessionId = randomUUID();
    const tokens = await this._tokenService.generateTokenPair({
      userId,
      role: CUSTOMER_AUTH_ROLE,
      sessionId,
    });

    await this._prismaService.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: this._getRefreshTokenHash(tokens.refreshToken),
        expiresAt: this._getRefreshTokenExpiresAt(),
      },
    });

    return tokens;
  }

  async sendOtp({
    whatsappNumber,
    ipAddress = 'unknown',
  }: SendOtpInput): Promise<SendOtpOutput> {
    const { sessionId, otp, expiresInSeconds, resendAfterSeconds } =
      await this._otpService.generate({
        userId: whatsappNumber,
        ipAddress,
      });

    try {
      await this._messageService.sendOtpMessage({ whatsappNumber, otp });
    } catch (error) {
      await this._otpService.invalidate(sessionId);
      throw error;
    }

    return { sessionId, expiresInSeconds, resendAfterSeconds };
  }

  async verifyOtp({
    sessionId,
    otp,
    ipAddress = 'unknown',
  }: VerifyOtpInput): Promise<VerifyOtpOutput> {
    const { userId: whatsappNumber } = await this._otpService.verify({
      sessionId,
      otp,
      ipAddress,
    });
    const existingUser = await this._prismaService.user.findFirst({
      where: { whatsappNumber },
      select: { id: true },
    });
    const user = existingUser
      ? await this._prismaService.user.update({
          where: { id: existingUser.id },
          data: { isWhatsappVerified: true },
          select: { id: true, whatsappNumber: true },
        })
      : await this._prismaService.user.create({
          data: {
            whatsappNumber,
            isWhatsappVerified: true,
            provider: AuthProvider.WHATSAPP,
          },
          select: { id: true, whatsappNumber: true },
        });
    const tokens = await this._createSessionTokenPair(user.id);

    return {
      userId: user.id,
      whatsappNumber: user.whatsappNumber ?? whatsappNumber,
      role: CUSTOMER_AUTH_ROLE,
      ...tokens,
    };
  }

  async refreshToken({
    refreshToken,
  }: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this._verifyRefreshToken(refreshToken);
    const session = await this._prismaService.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { select: { id: true, whatsappNumber: true } } },
    });

    if (
      !session ||
      session.userId !== payload.userId ||
      session.revoked ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    const isCurrentRefreshToken = this._isRefreshTokenHashMatch(
      refreshToken,
      session.refreshTokenHash,
    );
    const isPreviousRefreshToken = Boolean(
      session.previousRefreshTokenHash &&
      session.previousRefreshTokenExpiry &&
      session.previousRefreshTokenExpiry > new Date() &&
      this._isRefreshTokenHashMatch(
        refreshToken,
        session.previousRefreshTokenHash,
      ),
    );

    if (!isCurrentRefreshToken && !isPreviousRefreshToken) {
      await this._prismaService.session.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException(REFRESH_TOKEN_REUSED);
    }

    if (isPreviousRefreshToken) {
      const accessToken = await this._createAccessToken(session.user.id);

      return {
        userId: session.user.id,
        whatsappNumber: session.user.whatsappNumber ?? '',
        role: CUSTOMER_AUTH_ROLE,
        accessToken,
      };
    }

    const tokens = await this._tokenService.generateTokenPair({
      userId: session.user.id,
      role: CUSTOMER_AUTH_ROLE,
      sessionId: session.id,
    });

    await this._prismaService.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this._getRefreshTokenHash(tokens.refreshToken),
        previousRefreshTokenHash: session.refreshTokenHash,
        previousRefreshTokenExpiry: this._getPreviousRefreshTokenExpiresAt(),
        expiresAt: this._getRefreshTokenExpiresAt(),
      },
    });

    return {
      userId: session.user.id,
      whatsappNumber: session.user.whatsappNumber ?? '',
      role: CUSTOMER_AUTH_ROLE,
      ...tokens,
    };
  }

  async logout({ refreshToken }: LogoutInput): Promise<void> {
    try {
      const payload = await this._verifyRefreshToken(refreshToken);

      await this._prismaService.session.updateMany({
        where: { id: payload.sessionId, userId: payload.userId },
        data: { revoked: true },
      });
    } catch {
      return;
    }
  }

  async logoutAllDevices({ refreshToken }: LogoutInput): Promise<void> {
    const payload = await this._verifyRefreshToken(refreshToken);

    await this._prismaService.session.updateMany({
      where: { userId: payload.userId, revoked: false },
      data: { revoked: true },
    });
  }
}
