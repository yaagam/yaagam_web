import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { TemplesModule } from './modules/temples/temples.module';
import { PoojasModule } from './modules/poojas/poojas.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AdminModule } from './modules/admin/admin.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/logger.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './common/storage/storage.module';
import { TranslationModule } from './common/translation/translation.module';
import { BenifitsModule } from './modules/benifits/benifits.module';
import { SupportModule } from './modules/support/support.module';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: configService.get<number>('REDIS_PORT') ?? 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB') ?? 0,
        },
      }),
    }),
    StorageModule,
    TranslationModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    TemplesModule,
    PoojasModule,
    BookingsModule,
    TransactionsModule,
    AdminModule,
    SuperadminModule,
    HealthModule,
    BenifitsModule,
    SupportModule,
    BlogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
