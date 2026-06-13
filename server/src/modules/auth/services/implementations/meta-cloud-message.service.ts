import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMessageService,
  SendOtpMessageRequest,
} from '../interfaces/message.service.interface';

interface MetaErrorResponse {
  error?: {
    message?: string;
  };
}

@Injectable()
export class MetaCloudMessageService implements IMessageService {
  constructor(private readonly configService: ConfigService) {}

  async sendOtpMessage({
    whatsappNumber,
    otp,
  }: SendOtpMessageRequest): Promise<void> {
    const accessToken = this.configService.getOrThrow<string>(
      'META_WHATSAPP_ACCESS_TOKEN',
    );
    const phoneNumberId = this.configService.getOrThrow<string>(
      'META_WHATSAPP_PHONE_NUMBER_ID',
    );
    const templateName = this.configService.getOrThrow<string>(
      'META_WHATSAPP_OTP_TEMPLATE_NAME',
    );
    const imageUrl = this.configService.getOrThrow<string>(
      'META_WHATSAPP_OTP_IMAGE_URL',
    );
    const graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v25.0';
    const languageCode =
      this.configService.get<string>('META_WHATSAPP_TEMPLATE_LANGUAGE') ??
      'en_US';
    const countryCode =
      this.configService.get<string>('WHATSAPP_COUNTRY_CODE') ?? '91';
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
                type: 'header',
                parameters: [{ type: 'image', image: { link: imageUrl } }],
              },
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
      throw new BadGatewayException(
        metaError?.error?.message ?? 'Unable to send WhatsApp OTP',
      );
    }
  }
}
