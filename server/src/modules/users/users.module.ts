import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OTP_QUEUE } from '../auth/constants/otp-queue.const';
import { OTP_SERVICE } from '../auth/constants/service-tokens.const';
import { RedisOtpService } from '../auth/services/implementations/redis-otp.service';
import { USER_SERVICE } from './constants/service-tokens.const';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    GuardsModule,
    BullModule.registerQueue({ name: OTP_QUEUE }),
  ],
  providers: [
    { provide: USER_SERVICE, useClass: UsersService },
    { provide: OTP_SERVICE, useClass: RedisOtpService },
  ],
  controllers: [UsersController],
})
export class UsersModule {}
