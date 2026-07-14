import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../config/database-url.config';

@Injectable()
export default class PrismaService extends PrismaClient {
  constructor(_configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: getDatabaseUrl({
        DATABASE_URL: _configService.get<string>('DATABASE_URL'),
        NEON_DATABASE_URL: _configService.get<string>('NEON_DATABASE_URL'),
      }),
    });
    super({ adapter });
  }
}
