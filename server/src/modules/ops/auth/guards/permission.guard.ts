import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OPS_PERMISSIONS_KEY } from '../constants/metadata.const';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this._reflector.getAllAndOverride<string[]>(
      OPS_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    return !requiredPermissions?.length;
  }
}
