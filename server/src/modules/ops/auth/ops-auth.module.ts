import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OpsAuditModule } from '../audit/ops-audit.module';
import { OpsAuthController } from './ops-auth.controller';
import {
  OPS_AUTH_SERVICE,
  OPS_TOKEN_SERVICE,
} from './constants/service-tokens.const';
import { OpsJwtAuthGuard } from './guards/ops-jwt-auth.guard';
import { OpsLoginRateLimitGuard } from './guards/ops-login-rate-limit.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { OpsAuthService } from './services/ops-auth.service';
import { OpsJwtTokenService } from './services/ops-jwt-token.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule, OpsAuditModule],
  controllers: [OpsAuthController],
  providers: [
    { provide: OPS_AUTH_SERVICE, useClass: OpsAuthService },
    { provide: OPS_TOKEN_SERVICE, useClass: OpsJwtTokenService },
    OpsJwtAuthGuard,
    RoleGuard,
    PermissionGuard,
    OpsLoginRateLimitGuard,
  ],
  exports: [
    JwtModule,
    OpsJwtAuthGuard,
    RoleGuard,
    PermissionGuard,
    OPS_AUTH_SERVICE,
  ],
})
export class OpsAuthModule {}