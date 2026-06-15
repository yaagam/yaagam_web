export interface GenerateTokenPairInput {
  userId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokenPair(prop: GenerateTokenPairInput): Promise<TokenPair>;
}
