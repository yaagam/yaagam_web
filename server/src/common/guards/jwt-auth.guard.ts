import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  ACCESS_TOKEN_MISSING,
  INVALID_ACCESS_TOKEN,
} from '../../modules/auth/constants/errors.const';
import type { AuthRole } from '../../modules/auth/services/interfaces/token.service.interface';

interface AccessTokenPayload {
  userId: string;
  role: AuthRole;
}

type RequestWithAuth = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
  user?: AccessTokenPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this._extractToken(request);

    if (!token) {
      throw new UnauthorizedException(ACCESS_TOKEN_MISSING);
    }

    try {
      request.user = await this._jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this._configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN);
    }

    return true;
  }

  private _extractToken(request: RequestWithAuth): string | undefined {
    const accessTokenCookie = this._configService.getOrThrow<string>(
      'ACCESS_TOKEN_COOKIE',
    );
    const token = request.cookies?.[accessTokenCookie];

    return typeof token === 'string' ? token : undefined;
  }
}
