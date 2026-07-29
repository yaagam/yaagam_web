import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { META_WEBHOOK_SERVICE } from './constants/service-tokens.const';
import type { IMetaWebhookService } from './services/interfaces/meta-webhook.service.interface';

@Controller('auth/meta/webhook')
export class MetaWebhookController {
  constructor(
    @Inject(META_WEBHOOK_SERVICE)
    private readonly _webhookService: IMetaWebhookService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() response: Response,
  ): void {
    response
      .status(HttpStatus.OK)
      .send(this._webhookService.verifyChallenge(mode, token, challenge));
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Res() response: Response,
  ): void {
    this._webhookService.verifySignature(
      request.rawBody ?? Buffer.alloc(0),
      signature,
    );
    response.sendStatus(HttpStatus.OK); 
  }
}
