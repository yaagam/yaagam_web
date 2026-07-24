import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OPS_ACCESS_TOKEN_MISSING,
  OPS_INVALID_ACCESS_TOKEN,
} from '../constants/errors.const';
import type {
  OpsAuthenticatedRequest,
  OpsRequestOperator,
} from '../interfaces/ops-authenticated-request.interface';

@Injectable()
export class OpsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OpsAuthenticatedRequest>();
    const token = this._extractToken(request);

    if (!token) {
      throw new UnauthorizedException(OPS_ACCESS_TOKEN_MISSING);
    }

    try {
      request.operator = await this._jwtService.verifyAsync<OpsRequestOperator>(
        token,
        {
          secret: this._configService.getOrThrow<string>(
            'OPS_JWT_ACCESS_SECRET',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException(OPS_INVALID_ACCESS_TOKEN);
    }

    return true;
  }

  private _extractToken(request: OpsAuthenticatedRequest): string | undefined {
    const accessTokenCookie =
      this._configService.get<string>('OPS_ACCESS_TOKEN_COOKIE') ??
      'ops_access';
    const token = request.cookies?.[accessTokenCookie];

    return typeof token === 'string' ? token : undefined;
  }
}
