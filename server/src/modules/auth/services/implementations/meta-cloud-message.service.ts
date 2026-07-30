import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMessageService,
  SendOtpMessageRequest,
} from '../interfaces/message.service.interface';

interface MetaApiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

@Injectable()
export class MetaCloudMessageService implements IMessageService {
  private readonly _logger = new Logger(MetaCloudMessageService.name);
  private readonly _timeoutMs: number;

  constructor(private readonly _configService: ConfigService) {
    this._timeoutMs = Number(
      this._configService.get<string>('META_REQUEST_TIMEOUT_MS') ?? 8_000,
    );
    if (!Number.isInteger(this._timeoutMs) || this._timeoutMs < 1_000) {
      throw new Error('META_REQUEST_TIMEOUT_MS must be at least 1000');
    }
  }

  async sendOtpMessage({
    whatsappNumber,
  }: SendOtpMessageRequest): Promise<void> {
    const accessToken = this._requiredConfig('META_WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this._digitsConfig('META_WHATSAPP_PHONE_NUMBER_ID');
    const graphVersion =
      this._configService.get<string>('META_GRAPH_VERSION')?.trim() || 'v25.0';
    if (!/^v\d+\.\d+$/.test(graphVersion)) {
      throw new Error('META_GRAPH_VERSION must use the vN.N format');
    }

    const languageCode =
      this._configService
        .get<string>('META_WHATSAPP_TEMPLATE_LANGUAGE')
        ?.trim() || 'en_US';
    const countryCode =
      this._configService.get<string>('WHATSAPP_COUNTRY_CODE')?.trim() || '91';
    if (!/^\d{1,3}$/.test(countryCode)) {
      throw new Error('WHATSAPP_COUNTRY_CODE must contain 1 to 3 digits');
    }

    const recipient = `${countryCode}${whatsappNumber}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this._timeoutMs);
    try {
      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            type: 'template',
            template: {
              name: '3p_direct_integration_test_template',
              language: { code: languageCode },
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const providerError = (await response
          .json()
          .catch(() => null)) as MetaApiErrorResponse | null;
        this._logger.error({
          message: 'Meta WhatsApp rejected message request',
          status: response.status,
          error: providerError?.error,
        });
        throw new BadGatewayException('OTP delivery provider rejected request');
      }
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('OTP delivery timed out');
      }
      throw new ServiceUnavailableException('OTP delivery is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private _requiredConfig(key: string): string {
    const value = this._configService.getOrThrow<string>(key).trim();
    if (!value) throw new Error(`${key} must not be empty`);
    return value;
  }

  private _digitsConfig(key: string): string {
    const value = this._requiredConfig(key);
    if (!/^\d+$/.test(value))
      throw new Error(`${key} must contain only digits`);
    return value;
  }
}
