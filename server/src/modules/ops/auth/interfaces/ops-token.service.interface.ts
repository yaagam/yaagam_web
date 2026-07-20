import { OperatorRole } from '@prisma/client';

export interface OpsTokenPayload {
  operatorId: string;
  username: string;
  role: OperatorRole;
  sessionId: string;
}

export interface OpsTokenPair {
  accessToken: string;
  refreshToken: string;
}

export type GenerateOpsTokenPairInput = OpsTokenPayload;

export interface IOpsTokenService {
  generateTokenPair(input: GenerateOpsTokenPairInput): Promise<OpsTokenPair>;
}
