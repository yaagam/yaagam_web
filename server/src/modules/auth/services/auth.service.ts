import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { AuthProvider, type UserRole } from '@prisma/client';
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
import type { IOtpService } from './interfaces/otp.service.interface';
import type { ITokenService } from './interfaces/token.service.interface';
import { OTP_SERVICE, TOKEN_SERVICE } from '../constants/service-tokens.const';
import {
  OTP_QUEUE,
  SEND_OTP_JOB,
  type SendOtpJobData,
} from '../constants/otp-queue.const';
import PrismaService from '../../../prisma/prisma.service';
import { toAuthRole } from '../utils/auth-role.mapper';
import {
  INVALID_REFRESH_TOKEN,
  REFRESH_TOKEN_REUSED,
} from '../constants/errors.const';

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  exp?: number;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(OTP_SERVICE)
    private readonly otpService: IOtpService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @InjectQueue(OTP_QUEUE)
    private readonly otpQueue: Queue<SendOtpJobData>,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshFallbackTtlSeconds(): number {
    const ttl = Number(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS'),
    );

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('JWT refresh expiry value must be a positive number');
    }

    return ttl;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
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

  private getRefreshTokenHash(refreshToken: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(refreshToken)
      .digest('hex');
  }

  private isRefreshTokenHashMatch(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const incomingHash = this.getRefreshTokenHash(refreshToken);
    const incoming = Buffer.from(incomingHash, 'hex');
    const stored = Buffer.from(storedHash, 'hex');

    return (
      incoming.length === stored.length && timingSafeEqual(incoming, stored)
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.getRefreshFallbackTtlSeconds() * 1000);
  }

  private async createSessionTokenPair(userId: string, role: UserRole) {
    const sessionId = randomUUID();
    const tokens = await this.tokenService.generateTokenPair({
      userId,
      role: toAuthRole(role),
      sessionId,
    });

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: this.getRefreshTokenHash(tokens.refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return tokens;
  }

  async sendOtp({ whatsappNumber }: SendOtpInput): Promise<SendOtpOutput> {
    const { sessionId, otp } = await this.otpService.generate({
      userId: whatsappNumber,
    });

    console.log('otp', otp);

    await this.otpQueue.add(
      SEND_OTP_JOB,
      { whatsappNumber, otp },
      {
        jobId: sessionId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { sessionId };
  }

  async verifyOtp({
    sessionId,
    otp,
  }: VerifyOtpInput): Promise<VerifyOtpOutput> {
    const { userId: whatsappNumber } = await this.otpService.verify({
      sessionId,
      otp,
    });
    const existingUser = await this.prismaService.user.findFirst({
      where: { whatsappNumber },
      select: { id: true, role: true },
    });
    const user = existingUser
      ? await this.prismaService.user.update({
          where: { id: existingUser.id },
          data: { isWhatsappVerified: true },
          select: { id: true, role: true },
        })
      : await this.prismaService.user.create({
          data: {
            whatsappNumber,
            isWhatsappVerified: true,
            provider: AuthProvider.WHATSAPP,
          },
          select: { id: true, role: true },
        });
    const role = toAuthRole(user.role);
    const tokens = await this.createSessionTokenPair(user.id, user.role);

    return { userId: user.id, role, ...tokens };
  }

  async refreshToken({
    refreshToken,
  }: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prismaService.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { select: { id: true, role: true } } },
    });

    if (
      !session ||
      session.userId !== payload.userId ||
      session.revoked ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    if (!this.isRefreshTokenHashMatch(refreshToken, session.refreshTokenHash)) {
      await this.prismaService.session.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException(REFRESH_TOKEN_REUSED);
    }

    const role = toAuthRole(session.user.role);
    const tokens = await this.tokenService.generateTokenPair({
      userId: session.user.id,
      role,
      sessionId: session.id,
    });

    await this.prismaService.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.getRefreshTokenHash(tokens.refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return { userId: session.user.id, role, ...tokens };
  }

  async logout({ refreshToken }: LogoutInput): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prismaService.session.updateMany({
        where: { id: payload.sessionId, userId: payload.userId },
        data: { revoked: true },
      });
    } catch {
      return;
    }
  }

  async logoutAllDevices({ refreshToken }: LogoutInput): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);

    await this.prismaService.session.updateMany({
      where: { userId: payload.userId, revoked: false },
      data: { revoked: true },
    });
  }
}
