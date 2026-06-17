import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMessageService,
  SendOtpMessageRequest,
} from '../interfaces/message.service.interface';

interface MetaErrorResponse {
  error?: {
    code?: number;
    error_subcode?: number;
    message?: string;
    type?: string;
  };
}

@Injectable()
export class MetaCloudMessageService implements IMessageService {
  constructor(private readonly _configService: ConfigService) {}

  async sendOtpMessage({
    whatsappNumber,
    otp,
  }: SendOtpMessageRequest): Promise<void> {
    const accessToken = this._getRequiredConfig('META_WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this._getRequiredConfig(
      'META_WHATSAPP_PHONE_NUMBER_ID',
    );
    const templateName = this._getRequiredConfig(
      'META_WHATSAPP_OTP_TEMPLATE_NAME',
    );
    const graphVersion =
      this._configService.get<string>('META_GRAPH_VERSION') ?? 'v25.0';
    const languageCode =
      this._configService.get<string>('META_WHATSAPP_TEMPLATE_LANGUAGE') ??
      'en_US';
    const countryCode =
      this._configService.get<string>('WHATSAPP_COUNTRY_CODE') ?? '91';
    const recipient = whatsappNumber.startsWith(countryCode)
      ? whatsappNumber
      : `${countryCode}${whatsappNumber}`;

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
          to: recipient,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => undefined);
      const metaError = body as MetaErrorResponse | undefined;
      const error = metaError?.error;
      const errorReference = [
        error?.type,
        error?.code !== undefined ? `code ${error.code}` : undefined,
        error?.error_subcode !== undefined
          ? `subcode ${error.error_subcode}`
          : undefined,
      ]
        .filter(Boolean)
        .join(', ');

      throw new BadGatewayException(
        [
          error?.message ?? `Meta returned HTTP ${response.status}`,
          errorReference ? `(${errorReference})` : undefined,
        ]
          .filter(Boolean)
          .join(' '),
      );
    }
  }

  private _getRequiredConfig(key: string): string {
    const value = this._configService.getOrThrow<string>(key).trim();

    if (!value) {
      throw new Error(`${key} must not be empty`);
    }

    return value;
  }
}
