import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { MetaWebhookController } from './meta-webhook.controller';
import {
  AUTH_SERVICE,
  MESSAGE_SERVICE,
  META_WEBHOOK_SERVICE,
  OTP_SERVICE,
  TOKEN_SERVICE,
} from './constants/service-tokens.const';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/implementations/jwt-token.service';
import { MetaCloudMessageService } from './services/implementations/meta-cloud-message.service';
import { MetaWebhookService } from './services/implementations/meta-webhook.service';
import { RedisOtpService } from './services/implementations/redis-otp.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [AuthController, MetaWebhookController],
  providers: [
    { provide: AUTH_SERVICE, useClass: AuthService },
    { provide: OTP_SERVICE, useClass: RedisOtpService },
    { provide: MESSAGE_SERVICE, useClass: MetaCloudMessageService },
    { provide: META_WEBHOOK_SERVICE, useClass: MetaWebhookService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [MESSAGE_SERVICE, OTP_SERVICE],
})
export class AuthModule {}
