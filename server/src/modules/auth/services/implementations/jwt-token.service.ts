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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokenPair({
    userId,
  }: GenerateTokenPairInput): Promise<TokenPair> {
    const payload = { userId };
    const accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = Number(
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
    );
    const refreshExpiresIn = Number(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN_SECONDS'),
    );

    if (
      !Number.isFinite(accessExpiresIn) ||
      !Number.isFinite(refreshExpiresIn)
    ) {
      throw new Error('JWT expiry values must be numbers');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
