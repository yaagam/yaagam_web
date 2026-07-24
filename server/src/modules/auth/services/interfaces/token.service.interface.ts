export type AuthRole = 'user';

export interface GenerateTokenPairInput {
  userId: string;
  role: AuthRole;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokenPair(prop: GenerateTokenPairInput): Promise<TokenPair>;
}
