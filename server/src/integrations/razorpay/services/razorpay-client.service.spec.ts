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

  it('sends an upfront charge and scheduled recurring start', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'sub_123',
          status: 'created',
          charge_at: 1786210200,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await service.createSubscription({
      planId: 'plan_123',
      totalCount: 51,
      startAt: 1786210200,
      upfront: {
        name: 'Weekly Pooja - first week',
        amount: 50100,
        currency: 'INR',
      },
      notes: { booking_ref: 'booking-id' },
    });

    const request = fetchMock.mock.calls[0][1];
    expect(JSON.parse(request?.body as string)).toEqual(
      expect.objectContaining({
        plan_id: 'plan_123',
        total_count: 51,
        start_at: 1786210200,
        addons: [
          {
            item: {
              name: 'Weekly Pooja - first week',
              amount: 50100,
              currency: 'INR',
            },
          },
        ],
      }),
    );
    fetchMock.mockRestore();
  });

  it('fetches and normalizes a settlement by provider ID', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'setl_123',
          amount: 500,
          status: 'processed',
          fees: 10,
          tax: 2,
          utr: 'UTR123',
          created_at: 1786210200,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(service.fetchSettlement('setl_123')).resolves.toEqual({
      id: 'setl_123',
      amount: 500,
      status: 'processed',
      fees: 10,
      tax: 2,
      utr: 'UTR123',
      createdAt: 1786210200,
    });
    expect(fetchMock.mock.calls[0][0]).toContain('/settlements/setl_123');
    fetchMock.mockRestore();
  });
});
