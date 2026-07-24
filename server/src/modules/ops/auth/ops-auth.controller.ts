import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { OPS_INVALID_REFRESH_TOKEN } from './constants/errors.const';
import { OPS_AUTH_SERVICE } from './constants/service-tokens.const';
import { CurrentOperator } from './decorators/current-operator.decorator';
import { OpsLoginDto } from './dtos/ops-login.dto';
import { OpsJwtAuthGuard } from './guards/ops-jwt-auth.guard';
import { OpsLoginRateLimitGuard } from './guards/ops-login-rate-limit.guard';
import type {
  IOpsAuthService,
  OpsMeOutput,
} from './interfaces/ops-auth.service.interface';
import type {
  OpsAuthenticatedRequest,
  OpsRequestOperator,
} from './interfaces/ops-authenticated-request.interface';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

interface OpsAuthResponse {
  operatorId: string;
  username: string;
  role: string;
}

@Controller('ops/auth')
export class OpsAuthController {
  private readonly _accessTokenCookie: string;
  private readonly _refreshTokenCookie: string;
  private readonly _accessTokenCookieMaxAgeMs: number;
  private readonly _refreshTokenCookieMaxAgeMs: number;
  private readonly _cookieDomain?: string;

  constructor(
    @Inject(OPS_AUTH_SERVICE)
    private readonly _authService: IOpsAuthService,
    private readonly _configService: ConfigService,
  ) {
    this._accessTokenCookie =
      this._configService.get<string>('OPS_ACCESS_TOKEN_COOKIE') ??
      'ops_access';
    this._refreshTokenCookie =
      this._configService.get<string>('OPS_REFRESH_TOKEN_COOKIE') ??
      'ops_refresh';
    this._accessTokenCookieMaxAgeMs = Number(
      this._configService.get<string>('OPS_ACCESS_TOKEN_COOKIE_MAX_AGE_MS') ??
        900_000,
    );
    this._refreshTokenCookieMaxAgeMs = Number(
      this._configService.get<string>('OPS_REFRESH_TOKEN_COOKIE_MAX_AGE_MS') ??
        604_800_000,
    );
    this._cookieDomain =
      this._configService.get<string>('OPS_COOKIE_DOMAIN')?.trim() ||
      this._configService.get<string>('COOKIE_DOMAIN')?.trim();
  }

  @Post('login')
  @UseGuards(OpsLoginRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: OpsLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OpsAuthResponse> {
    const result = await this._authService.login({
      username: dto.username,
      password: dto.password,
      totpCode: dto.totpCode,
      ip: this._getIp(req),
      userAgent: this._getUserAgent(req),
    });

    this._setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      operatorId: result.operatorId,
      username: result.username,
      role: result.role,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OpsAuthResponse> {
    const refreshToken = req.cookies?.[this._refreshTokenCookie];

    if (!refreshToken) {
      throw new UnauthorizedException(OPS_INVALID_REFRESH_TOKEN);
    }

    const result = await this._authService.refresh({
      refreshToken,
      ip: this._getIp(req),
      userAgent: this._getUserAgent(req),
    });

    this._setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      operatorId: result.operatorId,
      username: result.username,
      role: result.role,
    };
  }

  @Post('logout')
  @UseGuards(OpsJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: OpsAuthenticatedRequest & RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this._authService.logout({
      refreshToken: req.cookies?.[this._refreshTokenCookie],
      operatorId: req.operator?.operatorId,
      ip: this._getIp(req),
      userAgent: this._getUserAgent(req),
    });
    this._clearAuthCookies(res);
  }

  @Get('me')
  @UseGuards(OpsJwtAuthGuard)
  me(@CurrentOperator() operator: OpsRequestOperator): Promise<OpsMeOutput> {
    return this._authService.me(operator.operatorId);
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
    res.clearCookie(
      this._accessTokenCookie,
      this._authCookieOptions(this._accessTokenCookie),
    );
    res.clearCookie(
      this._refreshTokenCookie,
      this._authCookieOptions(this._refreshTokenCookie),
    );
  }

  private _authCookieOptions(cookieName: string): CookieOptions {
    return {
      httpOnly: true,
      ...this._cookieDomainOptions(cookieName),
      path: '/',
      sameSite: this._cookieSameSite(),
      secure: this._isCookieSecure(cookieName),
    };
  }

  private _cookieDomainOptions(
    cookieName: string,
  ): Pick<CookieOptions, 'domain'> {
    if (!this._cookieDomain || cookieName.startsWith('__Host-')) {
      return {};
    }

    return { domain: this._cookieDomain };
  }

  private _cookieSameSite(): CookieOptions['sameSite'] {
    const configuredSameSite =
      this._configService.get<string>('OPS_COOKIE_SAME_SITE')?.toLowerCase() ??
      'lax';

    return configuredSameSite === 'none' || configuredSameSite === 'strict'
      ? configuredSameSite
      : 'lax';
  }

  private _isCookieSecure(cookieName: string): boolean {
    if (
      cookieName.startsWith('__Host-') ||
      cookieName.startsWith('__Secure-') ||
      this._cookieSameSite() === 'none'
    ) {
      return true;
    }

    const configuredSecure = this._configService
      .get<string>('OPS_COOKIE_SECURE')
      ?.toLowerCase();

    if (configuredSecure === 'true') {
      return true;
    }

    if (configuredSecure === 'false') {
      return false;
    }

    return process.env.NODE_ENV === 'production';
  }

  private _getIp(req: Pick<Request, 'ip' | 'socket'>): string | undefined {
    return req.ip || req.socket.remoteAddress || undefined;
  }

  private _getUserAgent(req: Pick<Request, 'get'>): string | undefined {
    return req.get('user-agent') || undefined;
  }
}
