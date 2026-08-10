import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RoleGuard } from './role.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, RoleGuard],
  exports: [JwtModule, JwtAuthGuard, RoleGuard],
})
export class GuardsModule {}
