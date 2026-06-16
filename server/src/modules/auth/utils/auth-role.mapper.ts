import type { UserRole } from '@prisma/client';
import type { AuthRole } from '../services/interfaces/token.service.interface';

export function toAuthRole(role: UserRole): AuthRole {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'SUPER_ADMIN':
      return 'super-admin';
    case 'USER':
      return 'user';
  }
}
