import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}

interface RazorpayQrCodeRequest {
  amount: number;
  description: string;
  name: string;
  notes: Record<string, string>;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayQrCodeResponse {
  id: string;
  image_url?: string;
  status: string;
}

@Injectable()
export class RazorpayClientService {
  private readonly _keyId: string;
  private readonly _keySecret: string;
  private readonly _baseUrl = 'https://api.razorpay.com/v1';

  constructor(private readonly _configService: ConfigService) {
    this._keyId = this._configService.getOrThrow<string>('RAZORPAY_KEY_ID');
    this._keySecret = this._configService.getOrThrow<string>(
      'RAZORPAY_KEY_SECRET',
    );
  }

  get keyId(): string {
    return this._keyId;
  }

  async createOrder(
    input: RazorpayOrderRequest,
  ): Promise<RazorpayOrderResponse> {
    const responseBody = await this._postToRazorpay<
      RazorpayOrderResponse | { error?: { description?: string } }
    >('/orders', {
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    if (!this._isRazorpayOrder(responseBody)) {
      this._throwRazorpayError(responseBody, 'Unable to create Razorpay order');
    }

    return responseBody;
  }

  async createQrCode(
    input: RazorpayQrCodeRequest,
  ): Promise<RazorpayQrCodeResponse> {
    const responseBody = await this._postToRazorpay<
      RazorpayQrCodeResponse | { error?: { description?: string } }
    >('/payments/qr_codes', {
      type: 'upi_qr',
      name: input.name,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: input.amount,
      description: input.description,
      notes: input.notes,
    });

    if (!this._isRazorpayQrCode(responseBody)) {
      this._throwRazorpayError(responseBody, 'Unable to create Razorpay QR');
    }

    return responseBody;
  }

  verifySignature({
    orderId,
    paymentId,
    subscriptionId,
    signature,
  }: {
    orderId?: string;
    paymentId: string;
    subscriptionId?: string;
    signature: string;
  }): boolean {
    const payload = subscriptionId
      ? `${paymentId}|${subscriptionId}`
      : `${orderId}|${paymentId}`;
    const expectedSignature = createHmac('sha256', this._keySecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  private async _postToRazorpay<T>(path: string, body: object): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this._keyId}:${this._keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const responseBody = (await response.json().catch(() => null)) as T;

    if (!response.ok) {
      this._throwRazorpayError(responseBody, 'Razorpay request failed');
    }

    return responseBody;
  }

  private _throwRazorpayError(
    responseBody: unknown,
    fallbackMessage: string,
  ): never {
    const description =
      responseBody &&
      typeof responseBody === 'object' &&
      'error' in responseBody &&
      typeof responseBody.error === 'object' &&
      responseBody.error &&
      'description' in responseBody.error &&
      typeof responseBody.error.description === 'string'
        ? responseBody.error.description
        : fallbackMessage;

    throw new BadGatewayException(description);
  }

  private _isRazorpayOrder(value: unknown): value is RazorpayOrderResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const order = value as Partial<RazorpayOrderResponse>;

    return (
      typeof order.id === 'string' &&
      typeof order.amount === 'number' &&
      typeof order.currency === 'string' &&
      typeof order.receipt === 'string' &&
      typeof order.status === 'string'
    );
  }

  private _isRazorpayQrCode(value: unknown): value is RazorpayQrCodeResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const qrCode = value as Partial<RazorpayQrCodeResponse>;

    return typeof qrCode.id === 'string' && typeof qrCode.status === 'string';
  }
}
