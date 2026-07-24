import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { verify as verifyPassword } from 'argon2';
import { verify as verifyTotp } from 'otplib';
import type { OperatorRole } from '@prisma/client';
import PrismaService from '../../../../prisma/prisma.service';
import { OPS_AUDIT_SERVICE } from '../../audit/constants/service-tokens.const';
import type { IOpsAuditService } from '../../audit/interfaces/ops-audit.service.interface';
import {
  OPS_ACCOUNT_DISABLED,
  OPS_ACCOUNT_LOCKED,
  OPS_INVALID_CREDENTIALS,
  OPS_INVALID_REFRESH_TOKEN,
  OPS_REFRESH_TOKEN_REUSED,
} from '../constants/errors.const';
import { OPS_TOKEN_SERVICE } from '../constants/service-tokens.const';
import type {
  IOpsAuthService,
  OpsAuthOutput,
  OpsLoginInput,
  OpsLogoutInput,
  OpsMeOutput,
  OpsRefreshInput,
} from '../interfaces/ops-auth.service.interface';
import type { IOpsTokenService } from '../interfaces/ops-token.service.interface';

interface OpsRefreshTokenPayload {
  operatorId: string;
  username: string;
  role: OperatorRole;
  sessionId: string;
}

@Injectable()
export class OpsAuthService implements IOpsAuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
    @Inject(OPS_TOKEN_SERVICE)
    private readonly _tokenService: IOpsTokenService,
    @Inject(OPS_AUDIT_SERVICE)
    private readonly _auditService: IOpsAuditService,
  ) {}

  async login(input: OpsLoginInput): Promise<OpsAuthOutput> {
    const username = input.username.trim().toLowerCase();
    const operator = await this._prismaService.operator.findUnique({
      where: { username },
    });

    if (!operator) {
      await this._auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'Operator',
        resourceId: username,
        ip: input.ip,
        userAgent: input.userAgent,
      });
      throw new UnauthorizedException(OPS_INVALID_CREDENTIALS);
    }

    this._assertCanAttemptLogin(operator.isActive, operator.lockedUntil);

    const passwordMatches = await verifyPassword(
      operator.passwordHash,
      input.password,
    ).catch(() => false);
    const totpResult = await verifyTotp({
      secret: operator.totpSecret,
      token: input.totpCode,
      period: this._getTotpPeriodSeconds(),
      epochTolerance: Number(
        this._configService.get<string>('OPS_TOTP_WINDOW_SECONDS') ?? 60,
      ),
    }).catch(() => ({ valid: false }));
    const totpMatches = totpResult.valid;

    if (!passwordMatches || !totpMatches) {
      await this._recordFailedLogin(operator.id, input);
      throw new UnauthorizedException(OPS_INVALID_CREDENTIALS);
    }

    await this._prismaService.operator.update({
      where: { id: operator.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        lastLoginIp: input.ip,
      },
    });

    const tokens = await this._createSessionTokenPair({
      operatorId: operator.id,
      username: operator.username,
      role: operator.role,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await this._auditService.log({
      operatorId: operator.id,
      action: 'LOGIN',
      resource: 'Operator',
      resourceId: operator.id,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return {
      operatorId: operator.id,
      username: operator.username,
      role: operator.role,
      ...tokens,
    };
  }

  async refresh(input: OpsRefreshInput): Promise<OpsAuthOutput> {
    const payload = await this._verifyRefreshToken(input.refreshToken);
    const session = await this._prismaService.opsSession.findUnique({
      where: { id: payload.sessionId },
      include: { operator: true },
    });

    if (
      !session ||
      session.operatorId !== payload.operatorId ||
      session.revoked ||
      session.expiresAt <= new Date() ||
      !session.operator.isActive
    ) {
      throw new UnauthorizedException(OPS_INVALID_REFRESH_TOKEN);
    }

    if (
      !this._isRefreshTokenHashMatch(
        input.refreshToken,
        session.refreshTokenHash,
      )
    ) {
      await this._prismaService.opsSession.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException(OPS_REFRESH_TOKEN_REUSED);
    }

    const tokens = await this._tokenService.generateTokenPair({
      operatorId: session.operator.id,
      username: session.operator.username,
      role: session.operator.role,
      sessionId: session.id,
    });

    await this._prismaService.opsSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this._getRefreshTokenHash(tokens.refreshToken),
        expiresAt: this._getRefreshTokenExpiresAt(),
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });

    return {
      operatorId: session.operator.id,
      username: session.operator.username,
      role: session.operator.role,
      ...tokens,
    };
  }

  async logout(input: OpsLogoutInput): Promise<void> {
    if (!input.refreshToken) {
      return;
    }

    try {
      const payload = await this._verifyRefreshToken(input.refreshToken);
      await this._prismaService.opsSession.updateMany({
        where: { id: payload.sessionId, operatorId: payload.operatorId },
        data: { revoked: true },
      });
      await this._auditService.log({
        operatorId: payload.operatorId,
        action: 'LOGOUT',
        resource: 'Operator',
        resourceId: payload.operatorId,
        ip: input.ip,
        userAgent: input.userAgent,
      });
    } catch {
      return;
    }
  }

  async me(operatorId: string): Promise<OpsMeOutput> {
    const operator = await this._prismaService.operator.findUnique({
      where: { id: operatorId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
    });

    if (!operator || !operator.isActive) {
      throw new UnauthorizedException(OPS_INVALID_REFRESH_TOKEN);
    }

    return {
      operatorId: operator.id,
      username: operator.username,
      role: operator.role,
      isActive: operator.isActive,
      lastLogin: operator.lastLogin,
    };
  }

  private _getTotpPeriodSeconds(): number {
    return Number(
      this._configService.get<string>('OPS_TOTP_PERIOD_SECONDS') ?? 60,
    );
  }

  private _assertCanAttemptLogin(
    isActive: boolean,
    lockedUntil: Date | null,
  ): void {
    if (!isActive) {
      throw new UnauthorizedException(OPS_ACCOUNT_DISABLED);
    }

    if (lockedUntil && lockedUntil > new Date()) {
      throw new UnauthorizedException(OPS_ACCOUNT_LOCKED);
    }
  }

  private async _recordFailedLogin(
    operatorId: string,
    input: OpsLoginInput,
  ): Promise<void> {
    const maxAttempts = Number(
      this._configService.get<string>('OPS_LOGIN_MAX_FAILURES') ?? 5,
    );
    const lockoutMinutes = Number(
      this._configService.get<string>('OPS_LOGIN_LOCKOUT_MINUTES') ?? 15,
    );
    const operator = await this._prismaService.operator.findUnique({
      where: { id: operatorId },
      select: { failedLoginAttempts: true },
    });
    const failedLoginAttempts = (operator?.failedLoginAttempts ?? 0) + 1;
    const lockedUntil =
      failedLoginAttempts >= maxAttempts
        ? new Date(Date.now() + lockoutMinutes * 60_000)
        : null;

    await this._prismaService.operator.update({
      where: { id: operatorId },
      data: { failedLoginAttempts, lockedUntil },
    });
    await this._auditService.log({
      operatorId,
      action: 'LOGIN_FAILED',
      resource: 'Operator',
      resourceId: operatorId,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }

  private async _createSessionTokenPair(input: {
    operatorId: string;
    username: string;
    role: OperatorRole;
    ip?: string;
    userAgent?: string;
  }) {
    const sessionId = randomUUID();
    const tokens = await this._tokenService.generateTokenPair({
      operatorId: input.operatorId,
      username: input.username,
      role: input.role,
      sessionId,
    });

    await this._prismaService.opsSession.create({
      data: {
        id: sessionId,
        operatorId: input.operatorId,
        refreshTokenHash: this._getRefreshTokenHash(tokens.refreshToken),
        expiresAt: this._getRefreshTokenExpiresAt(),
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });

    return tokens;
  }

  private async _verifyRefreshToken(
    refreshToken: string,
  ): Promise<OpsRefreshTokenPayload> {
    try {
      const payload =
        await this._jwtService.verifyAsync<OpsRefreshTokenPayload>(
          refreshToken,
          {
            secret: this._configService.getOrThrow<string>(
              'OPS_JWT_REFRESH_SECRET',
            ),
          },
        );

      if (!payload.operatorId || !payload.sessionId) {
        throw new Error('Missing operations refresh token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(OPS_INVALID_REFRESH_TOKEN);
    }
  }

  private _getRefreshTokenHash(refreshToken: string): string {
    return createHmac(
      'sha256',
      this._configService.getOrThrow<string>('OPS_JWT_REFRESH_SECRET'),
    )
      .update(refreshToken)
      .digest('hex');
  }

  private _isRefreshTokenHashMatch(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const incoming = Buffer.from(
      this._getRefreshTokenHash(refreshToken),
      'hex',
    );
    const stored = Buffer.from(storedHash, 'hex');

    return (
      incoming.length === stored.length && timingSafeEqual(incoming, stored)
    );
  }

  private _getRefreshTokenExpiresAt(): Date {
    const ttl = Number(
      this._configService.get<string>('OPS_JWT_REFRESH_EXPIRES_IN_SECONDS') ??
        604800,
    );

    return new Date(Date.now() + ttl * 1000);
  }
}
