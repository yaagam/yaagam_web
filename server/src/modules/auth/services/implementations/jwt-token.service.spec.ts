import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  it('generates access and refresh tokens with the session ID only in the refresh payload', async () => {
    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES_IN_SECONDS: '900',
          JWT_REFRESH_EXPIRES_IN_SECONDS: '604800',
        };

        return config[key];
      }),
    };
    const service = new JwtTokenService(
      jwtService as never,
      configService as never,
    );

    await expect(
      service.generateTokenPair({
        userId: 'user-id',
        role: 'admin',
        sessionId: 'session-id',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      { userId: 'user-id', role: 'admin' },
      { secret: 'access-secret', expiresIn: 900 },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { userId: 'user-id', role: 'admin', sessionId: 'session-id' },
      { secret: 'refresh-secret', expiresIn: 604800 },
    );
  });
});
