import { SetMetadata } from '@nestjs/common';
import { OPS_PERMISSIONS_KEY } from '../constants/metadata.const';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(OPS_PERMISSIONS_KEY, permissions);
