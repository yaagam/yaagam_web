import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
} from '@nestjs/common';
import { ZOHO_BOOKS_SERVICE } from './constants/service-tokens.const';
import type {
  CompleteZohoOAuthResult,
  IZohoBooksService,
} from './services/zoho-books.service.interface';

@Controller('zoho/oauth')
export class ZohoOAuthController {
  constructor(
    @Inject(ZOHO_BOOKS_SERVICE)
    private readonly _zohoBooksService: IZohoBooksService,
  ) {}

  @Get('callback')
  completeOAuthCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') providerError?: string,
  ): Promise<CompleteZohoOAuthResult> {
    if (providerError) {
      throw new BadRequestException(
        `Zoho authorization failed: ${providerError}`,
      );
    }
    if (!code?.trim() || !state?.trim()) {
      throw new BadRequestException('Zoho OAuth code and state are required');
    }
    return this._zohoBooksService.completeOAuthCallback(
      code.trim(),
      state.trim(),
    );
  }
}
