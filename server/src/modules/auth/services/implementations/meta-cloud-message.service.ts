import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMessageService,
  SendOtpMessageRequest,
} from '../interfaces/message.service.interface';

interface MetaTemplateComponent {
  type: 'body' | 'button';
  sub_type?: 'url';
  index?: string;
  parameters: Array<{ type: 'text'; text: string }>;
}

@Injectable()
export class MetaCloudMessageService implements IMessageService {
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
    otp,
  }: SendOtpMessageRequest): Promise<void> {
    const accessToken = this._requiredConfig('META_WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this._digitsConfig('META_WHATSAPP_PHONE_NUMBER_ID');
    const templateName = this._requiredConfig(
      'META_WHATSAPP_OTP_TEMPLATE_NAME',
    );
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
    const components: MetaTemplateComponent[] = [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otp }],
      },
    ];
    if (
      this._configService
        .get<string>('META_WHATSAPP_OTP_BUTTON_ENABLED')
        ?.toLowerCase() !== 'false'
    ) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: otp }],
      });
    }

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
              name: templateName,
              language: { code: languageCode },
              components,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
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
