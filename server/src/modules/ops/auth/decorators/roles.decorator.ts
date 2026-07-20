import { SetMetadata } from '@nestjs/common';
import { OperatorRole } from '@prisma/client';
import { OPS_ROLES_KEY } from '../constants/metadata.const';

export const Roles = (...roles: OperatorRole[]) =>
  SetMetadata(OPS_ROLES_KEY, roles);
