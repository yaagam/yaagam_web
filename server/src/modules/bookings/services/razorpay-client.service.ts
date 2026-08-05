import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  IPaymentProvider,
  ProviderOrder,
  ProviderPayment,
  ProviderPlan,
  ProviderSubscription,
} from '../../transactions/interfaces/payment-provider.interface';

type JsonObject = Record<string, unknown>;

@Injectable()
export class RazorpayClientService implements IPaymentProvider {
  private readonly _keyId: string;
  private readonly _keySecret: string;
  private readonly _webhookSecret: string;
  private readonly _baseUrl: string;
  private readonly _timeoutMs: number;

  constructor(private readonly _configService: ConfigService) {
    this._keyId = this._configService.getOrThrow<string>('RAZORPAY_KEY_ID');
    this._keySecret = this._configService.getOrThrow<string>(
      'RAZORPAY_KEY_SECRET',
    );
    this._webhookSecret = this._configService.getOrThrow<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );
    this._baseUrl = this._configService.get<string>(
      'RAZORPAY_BASE_URL',
      'https://api.razorpay.com/v1',
    );
    this._timeoutMs = this._configService.get<number>(
      'RAZORPAY_TIMEOUT_MS',
      8000,
    );
  }

  get keyId(): string {
    return this._keyId;
  }

  async createOrder(input: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }): Promise<ProviderOrder> {
    const value = await this._request('POST', '/orders', input);
    this._require(value, ['id', 'amount', 'currency', 'receipt', 'status']);
    return value as unknown as ProviderOrder;
  }

  async createPlan(input: {
    name: string;
    amount: number;
    currency: string;
    interval: number;
    notes: Record<string, string>;
  }): Promise<ProviderPlan> {
    const value = await this._request('POST', '/plans', {
      period: 'weekly',
      interval: input.interval,
      item: {
        name: input.name,
        amount: input.amount,
        currency: input.currency,
      },
      notes: input.notes,
    });
    this._require(value, ['id', 'period', 'interval']);
    return value as unknown as ProviderPlan;
  }

  async createSubscription(input: {
    planId: string;
    totalCount: number;
    startAt?: number;
    upfront?: {
      name: string;
      amount: number;
      currency: string;
    };
    notes: Record<string, string>;
  }): Promise<ProviderSubscription> {
    const value = await this._request('POST', '/subscriptions', {
      plan_id: input.planId,
      total_count: input.totalCount,
      quantity: 1,
      customer_notify: 0,
      start_at: input.startAt,
      addons: input.upfront
        ? [
            {
              item: {
                name: input.upfront.name,
                amount: input.upfront.amount,
                currency: input.upfront.currency,
              },
            },
          ]
        : undefined,
      notes: input.notes,
    });
    this._require(value, ['id', 'status']);
    return {
      id: value.id as string,
      status: value.status as string,
      shortUrl: value.short_url as string | undefined,
      chargeAt: value.charge_at as number | undefined,
    };
  }

  async pauseSubscription(id: string): Promise<void> {
    await this._request(
      'POST',
      `/subscriptions/${encodeURIComponent(id)}/pause`,
      { pause_at: 'now' },
    );
  }
  async resumeSubscription(id: string): Promise<void> {
    await this._request(
      'POST',
      `/subscriptions/${encodeURIComponent(id)}/resume`,
      { resume_at: 'now' },
    );
  }
  async cancelSubscription(id: string): Promise<void> {
    await this._request(
      'POST',
      `/subscriptions/${encodeURIComponent(id)}/cancel`,
      { cancel_at_cycle_end: 0 },
    );
  }
  async fetchPayment(id: string): Promise<ProviderPayment> {
    const value = await this._request(
      'GET',
      `/payments/${encodeURIComponent(id)}`,
    );
    this._require(value, ['id', 'amount', 'currency', 'status', 'captured']);
    return {
      id: value.id as string,
      orderId: value.order_id as string | undefined,
      amount: value.amount as number,
      currency: value.currency as string,
      status: value.status as string,
      captured: value.captured as boolean,
    };
  }

  verifyPaymentSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    return this._verify(
      `${input.orderId}|${input.paymentId}`,
      input.signature,
      this._keySecret,
    );
  }
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    return this._verify(rawBody, signature, this._webhookSecret);
  }
  verifySignature(input: {
    orderId?: string;
    paymentId: string;
    subscriptionId?: string;
    signature: string;
  }): boolean {
    const first = input.subscriptionId ? input.paymentId : input.orderId;
    const second = input.subscriptionId ?? input.paymentId;
    return (
      Boolean(first) &&
      this._verify(`${first}|${second}`, input.signature, this._keySecret)
    );
  }

  private _verify(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): boolean {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const expected = Buffer.from(
      createHmac('sha256', secret).update(payload).digest('hex'),
      'utf8',
    );
    const actual = Buffer.from(signature.toLowerCase(), 'utf8');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private async _request(
    method: 'GET' | 'POST',
    path: string,
    body?: object,
  ): Promise<JsonObject> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this._timeoutMs);
    try {
      const response = await fetch(`${this._baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Basic ${Buffer.from(`${this._keyId}:${this._keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Yaagam-Payments/1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const value = (await response.json().catch(() => ({}))) as JsonObject;
      if (!response.ok)
        throw new BadGatewayException({
          code: 'PAYMENT_PROVIDER_ERROR',
          message: 'Payment provider request failed',
        });
      return value;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (error instanceof Error && error.name === 'AbortError')
        throw new ServiceUnavailableException({
          code: 'PAYMENT_PROVIDER_TIMEOUT',
          message: 'Payment provider timed out',
        });
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'Payment provider is unavailable',
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private _require(value: JsonObject, fields: string[]): void {
    if (
      !value ||
      typeof value !== 'object' ||
      fields.some(
        (field) => value[field] === undefined || value[field] === null,
      )
    )
      throw new BadGatewayException({
        code: 'INVALID_PROVIDER_RESPONSE',
        message: 'Payment provider returned an invalid response',
      });
  }
}
