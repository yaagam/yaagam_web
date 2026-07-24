import type { Request } from 'express';
import type { OperatorRole } from '@prisma/client';

export interface OpsRequestOperator {
  operatorId: string;
  username: string;
  role: OperatorRole;
  sessionId: string;
}

export type OpsAuthenticatedRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
  operator?: OpsRequestOperator;
};
