import type { OperatorRole } from '@prisma/client';
import type { CreateOperatorDto } from './create-operator.dto';

export interface CreatedOperatorOutput {
  id: string;
  username: string;
  role: OperatorRole;
  isActive: boolean;
  totpSecret: string;
  totpUri: string;
  createdAt: Date;
}

export interface OperatorListItem {
  id: string;
  username: string;
  role: OperatorRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOpsUsersService {
  createOperator(dto: CreateOperatorDto): Promise<CreatedOperatorOutput>;
  getOperators(): Promise<OperatorListItem[]>;
}
