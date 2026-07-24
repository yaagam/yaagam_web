import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OperatorRole } from '@prisma/client';
import { OPS_ROLES_KEY } from '../constants/metadata.const';
import type { OpsAuthenticatedRequest } from '../interfaces/ops-authenticated-request.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this._reflector.getAllAndOverride<OperatorRole[]>(
      OPS_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<OpsAuthenticatedRequest>();
    const role = request.operator?.role;

    return Boolean(role && requiredRoles.includes(role));
  }
}
