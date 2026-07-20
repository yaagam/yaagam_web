import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  GenerateOpsTokenPairInput,
  IOpsTokenService,
  OpsTokenPair,
} from '../interfaces/ops-token.service.interface';

@Injectable()
export class OpsJwtTokenService implements IOpsTokenService {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async generateTokenPair(
    input: GenerateOpsTokenPairInput,
  ): Promise<OpsTokenPair> {
    const payload = {
      operatorId: input.operatorId,
      username: input.username,
      role: input.role,
      sessionId: input.sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this._jwtService.signAsync(payload, {
        secret: this._configService.getOrThrow<string>('OPS_JWT_ACCESS_SECRET'),
        expiresIn: (this._configService.get<string>(
          'OPS_JWT_ACCESS_EXPIRES_IN',
        ) ?? '15m') as never,
      }),
      this._jwtService.signAsync(payload, {
        secret: this._configService.getOrThrow<string>(
          'OPS_JWT_REFRESH_SECRET',
        ),
        expiresIn: (this._configService.get<string>(
          'OPS_JWT_REFRESH_EXPIRES_IN',
        ) ?? '7d') as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
