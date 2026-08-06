import { Module } from '@nestjs/common';
import { TemplesController } from './temples.controller';
import { ServicesService } from './services/services.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuardsModule } from 'src/common/gurads/guards.module';
import {
  TEMPLE_SERVICE,
  ZOHO_BOOKS_SERVICE,
} from './constants/service-tokens.const';
import { ZohoBooksService } from './services/zoho-books.service';
import { ZohoOAuthController } from './zoho-oauth.controller';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [TemplesController, ZohoOAuthController],
  providers: [
    { provide: TEMPLE_SERVICE, useClass: ServicesService },
    { provide: ZOHO_BOOKS_SERVICE, useClass: ZohoBooksService },
  ],
  exports: [TEMPLE_SERVICE],
})
export class TemplesModule {}
