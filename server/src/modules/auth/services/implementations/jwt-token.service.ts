import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  GenerateTokenPairInput,
  ITokenService,
  TokenPair,
} from '../interfaces/token.service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async generateTokenPair({
    userId,
    role,
    sessionId,
  }: GenerateTokenPairInput): Promise<TokenPair> {
    const accessPayload = { userId, role };
    const refreshPayload = { userId, role, sessionId };
    const accessSecret =
      this._configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret =
      this._configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = Number(
      this._configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
    );
    const refreshExpiresIn = Number(
      this._configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS'),
    );

    if (
      !Number.isFinite(accessExpiresIn) ||
      !Number.isFinite(refreshExpiresIn)
    ) {
      throw new Error('JWT expiry values must be numbers');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this._jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this._jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
