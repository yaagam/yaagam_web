import type { OperatorRole } from '@prisma/client';

export interface OpsRequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface OpsLoginInput extends OpsRequestMeta {
  username: string;
  password: string;
  totpCode: string;
}

export interface OpsRefreshInput extends OpsRequestMeta {
  refreshToken: string;
}

export interface OpsLogoutInput extends OpsRequestMeta {
  refreshToken?: string;
  operatorId?: string;
}

export interface OpsAuthOutput {
  operatorId: string;
  username: string;
  role: OperatorRole;
  accessToken: string;
  refreshToken: string;
}

export interface OpsMeOutput {
  operatorId: string;
  username: string;
  role: OperatorRole;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface IOpsAuthService {
  login(input: OpsLoginInput): Promise<OpsAuthOutput>;
  refresh(input: OpsRefreshInput): Promise<OpsAuthOutput>;
  logout(input: OpsLogoutInput): Promise<void>;
  me(operatorId: string): Promise<OpsMeOutput>;
}
