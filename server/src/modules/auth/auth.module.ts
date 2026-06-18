import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MetaCloudMessageService } from './services/implementations/meta-cloud-message.service';
import { RedisOtpService } from './services/implementations/redis-otp.service';
import { JwtTokenService } from './services/implementations/jwt-token.service';
import { OtpProcessor } from './processors/otp.processor';
import { OTP_QUEUE } from './constants/otp-queue.const';
import {
  AUTH_SERVICE,
  MESSAGE_SERVICE,
  OTP_SERVICE,
  TOKEN_SERVICE,
} from './constants/service-tokens.const';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule,
    BullModule.registerQueue({ name: OTP_QUEUE }),
  ],
  controllers: [AuthController],
  providers: [
    OtpProcessor,
    { provide: AUTH_SERVICE, useClass: AuthService },
    { provide: OTP_SERVICE, useClass: RedisOtpService },
    { provide: MESSAGE_SERVICE, useClass: MetaCloudMessageService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class AuthModule {}
