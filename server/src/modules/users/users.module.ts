import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/guards/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { USER_SERVICE } from './constants/service-tokens.const';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, GuardsModule, AuthModule],
  providers: [{ provide: USER_SERVICE, useClass: UsersService }],
  controllers: [UsersController],
})
export class UsersModule {}
