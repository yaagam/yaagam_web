import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IMessageService,
  SendAutopayCutoffReminderRequest,
  SendBookingConfirmationRequest,
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
    otp,
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
    const recipient = this._createRecipient(whatsappNumber);
    const templateName = this._requiredConfig(
      'META_WHATSAPP_OTP_TEMPLATE_NAME',
    );
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
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: otp }],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [{ type: 'text', text: otp }],
                },
              ],
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

  async sendBookingConfirmation({
    whatsappNumber,
    imageUrl,
    customerName,
    bookingId,
    poojaName,
    templeName,
    poojaDate,
    poojaTime,
  }: SendBookingConfirmationRequest): Promise<void> {
    const accessToken = this._requiredConfig('META_WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this._digitsConfig('META_WHATSAPP_PHONE_NUMBER_ID');
    const graphVersion =
      this._configService.get<string>('META_GRAPH_VERSION')?.trim() || 'v25.0';
    const templateName =
      this._configService
        .get<string>('META_WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE_NAME')
        ?.trim() || 'pooja_booking_confirmation';
    const languageCode =
      this._configService
        .get<string>('META_WHATSAPP_BOOKING_CONFIRMATION_LANGUAGE')
        ?.trim() || 'en';
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
            to: this._createRecipient(whatsappNumber),
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components: [
                {
                  type: 'header',
                  parameters: [
                    { type: 'image', image: { link: imageUrl } },
                  ],
                },
                {
                  type: 'body',
                  parameters: [
                    customerName,
                    bookingId,
                    poojaName,
                    templeName,
                    poojaDate,
                    poojaTime,
                  ].map((text) => ({ type: 'text', text })),
                },
              ],
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
          message: 'Meta WhatsApp rejected booking confirmation',
          status: response.status,
          error: providerError?.error,
          bookingId,
        });
        throw new BadGatewayException(
          'Booking confirmation provider rejected request',
        );
      }
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'Booking confirmation delivery timed out',
        );
      }
      throw new ServiceUnavailableException(
        'Booking confirmation delivery is unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }


  async sendAutopayCutoffReminder({
    whatsappNumber,
    amount,
    poojaName,
    chargeDate,
  }: SendAutopayCutoffReminderRequest): Promise<void> {
    const accessToken = this._requiredConfig('META_WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this._digitsConfig('META_WHATSAPP_PHONE_NUMBER_ID');
    const graphVersion =
      this._configService.get<string>('META_GRAPH_VERSION')?.trim() || 'v25.0';
    const templateName =
      this._configService
        .get<string>('META_WHATSAPP_AUTOPAY_REMINDER_TEMPLATE_NAME')
        ?.trim() || 'autopay_cutoff_reminder';
    const languageCode =
      this._configService
        .get<string>('META_WHATSAPP_AUTOPAY_REMINDER_LANGUAGE')
        ?.trim() || 'en';
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
            to: this._createRecipient(whatsappNumber),
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components: [
                {
                  type: 'body',
                  parameters: [amount, poojaName, chargeDate].map((text) => ({
                    type: 'text',
                    text,
                  })),
                },
              ],
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
          message: 'Meta WhatsApp rejected autopay cutoff reminder',
          status: response.status,
          error: providerError?.error,
        });
        throw new BadGatewayException(
          'Autopay reminder provider rejected request',
        );
      }
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('Autopay reminder timed out');
      }
      throw new ServiceUnavailableException(
        'Autopay reminder delivery is unavailable',
      );
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

  private _createRecipient(whatsappNumber: string): string {
    const normalizedNumber = whatsappNumber.trim();
    if (normalizedNumber.startsWith('+')) {
      const internationalDigits = normalizedNumber.slice(1);
      if (!/^[1-9]\d{7,14}$/.test(internationalDigits)) {
        throw new Error('WhatsApp number must use E.164 format');
      }
      return internationalDigits;
    }

    const countryCode =
      this._configService.get<string>('WHATSAPP_COUNTRY_CODE')?.trim() || '91';
    if (!/^\d{1,3}$/.test(countryCode)) {
      throw new Error('WHATSAPP_COUNTRY_CODE must contain 1 to 3 digits');
    }
    if (!/^\d{8,15}$/.test(normalizedNumber)) {
      throw new Error('WhatsApp number must contain 8 to 15 digits');
    }
    return `${countryCode}${normalizedNumber}`;
  }
}
