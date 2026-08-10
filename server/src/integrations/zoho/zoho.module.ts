import { Module } from '@nestjs/common';
import { ZOHO_BOOKS_SERVICE } from './constants/zoho-service-token.const';
import { ZohoBooksService } from './services/zoho-books.service';
import { ZohoOAuthController } from './zoho-oauth.controller';

@Module({
  controllers: [ZohoOAuthController],
  providers: [{ provide: ZOHO_BOOKS_SERVICE, useClass: ZohoBooksService }],
  exports: [ZOHO_BOOKS_SERVICE],
})
export class ZohoModule {}
