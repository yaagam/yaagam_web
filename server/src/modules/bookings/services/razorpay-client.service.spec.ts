import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { RazorpayClientService } from './razorpay-client.service';
describe('RazorpayClientService signatures', () => {
  const values: Record<string, string | number> = {
    RAZORPAY_KEY_ID: 'key',
    RAZORPAY_KEY_SECRET: 'payment-secret',
    RAZORPAY_WEBHOOK_SECRET: 'webhook-secret',
    RAZORPAY_TIMEOUT_MS: 100,
  };
  const config = {
    getOrThrow: (key: string) => values[key],
    get: (key: string, fallback: unknown) => values[key] ?? fallback,
  } as ConfigService;
  const service = new RazorpayClientService(config);
  it('verifies payment signatures', () => {
    const signature = createHmac('sha256', 'payment-secret')
      .update('order|payment')
      .digest('hex');
    expect(
      service.verifyPaymentSignature({
        orderId: 'order',
        paymentId: 'payment',
        signature,
      }),
    ).toBe(true);
    expect(
      service.verifyPaymentSignature({
        orderId: 'order',
        paymentId: 'payment',
        signature: '0'.repeat(64),
      }),
    ).toBe(false);
  });
  it('verifies webhook bytes exactly', () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = createHmac('sha256', 'webhook-secret')
      .update(body)
      .digest('hex');
    expect(service.verifyWebhookSignature(body, signature)).toBe(true);
    expect(service.verifyWebhookSignature(Buffer.from('{}'), signature)).toBe(
      false,
    );
  });
  it('rejects malformed signatures without throwing', () => {
    expect(service.verifyWebhookSignature(Buffer.from('{}'), 'invalid')).toBe(
      false,
    );
  });
});
