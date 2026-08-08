import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { TemplesModule } from './modules/temples/temples.module';
import { PoojasModule } from './modules/poojas/poojas.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/logger.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './common/storage/storage.module';
import { TranslationModule } from './common/translation/translation.module';
import { BenifitsModule } from './modules/benifits/benifits.module';
import { SupportModule } from './modules/support/support.module';
import { OpsModule } from './modules/ops/ops.module';
import { getRedisConnectionOptions } from './config/redis/redis-connection.config';
import { OfferingsModule } from './modules/offerings/offerings.module';
import { SecurityModule } from './common/security/security.module';
import { TrustedProxyMiddleware } from './common/security/trusted-proxy.middleware';
import { ImageModule } from './common/image/image.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConnectionOptions(
          {
            REDIS_URL: configService.get<string>('REDIS_URL'),
            UPSTASH_REDIS_URL: configService.get<string>('UPSTASH_REDIS_URL'),
            REDIS_HOST: configService.get<string>('REDIS_HOST'),
            REDIS_PORT: configService.get<string>('REDIS_PORT'),
            REDIS_USERNAME: configService.get<string>('REDIS_USERNAME'),
            REDIS_PASSWORD: configService.get<string>('REDIS_PASSWORD'),
            REDIS_DB: configService.get<string>('REDIS_DB'),
            NODE_ENV: configService.get<string>('NODE_ENV'),
          },
          { maxRetriesPerRequest: null },
        ),
      }),
    }),
    SecurityModule,
    StorageModule,
    ImageModule,
    TranslationModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    TemplesModule,
    PoojasModule,
    OfferingsModule,
    BookingsModule,
    TransactionsModule,
    HealthModule,
    BenifitsModule,
    SupportModule,
    OpsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TrustedProxyMiddleware)
      .exclude({
        path: 'zoho/oauth/callback',
        method: RequestMethod.GET,
      })
      .forRoutes('*');
  }
}
