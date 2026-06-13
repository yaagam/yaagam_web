import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { MetaCloudMessageService } from './services/implementations/meta-cloud-message.service';
import { RedisOtpService } from './services/implementations/redis-otp.service';
import { OtpProcessor } from './services/otp.processor';
import { OTP_QUEUE } from './services/otp-queue.constants';
import { MESSAGE_SERVICE, OTP_SERVICE } from './services/tokens.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: configService.get<number>('REDIS_PORT') ?? 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB') ?? 0,
        },
      }),
    }),
    BullModule.registerQueue({ name: OTP_QUEUE }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpProcessor,
    { provide: OTP_SERVICE, useClass: RedisOtpService },
    { provide: MESSAGE_SERVICE, useClass: MetaCloudMessageService },
  ],
})
export class AuthModule {}
