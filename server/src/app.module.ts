import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevoteesModule } from './modules/devotees/devotees.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    DevoteesModule,
    AddressesModule,
    TemplesModule,
    PoojasModule,
    BookingsModule,
    TransactionsModule,
    AdminModule,
    SuperadminModule,
    HealthModule,
    LoggerModule.forRootAsync({
      useFactory: loggerConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
