import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaCloudMessageService } from './meta-cloud-message.service';

describe('MetaCloudMessageService', () => {
  const values: Record<string, string> = {
    META_WHATSAPP_ACCESS_TOKEN: 'meta-access-token',
    META_WHATSAPP_PHONE_NUMBER_ID: '123456789',
    META_WHATSAPP_OTP_TEMPLATE_NAME: 'login_otp',
    META_GRAPH_VERSION: 'v25.0',
    META_WHATSAPP_TEMPLATE_LANGUAGE: 'en_US',
    META_WHATSAPP_OTP_BUTTON_ENABLED: 'true',
    WHATSAPP_COUNTRY_CODE: '91',
    META_REQUEST_TIMEOUT_MS: '8000',
  };
  const config = {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => values[key],
  } as ConfigService;

  afterEach(() => jest.restoreAllMocks());

  it('sends the approved authentication template directly to Meta', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const service = new MetaCloudMessageService(config);

    await service.sendOtpMessage({
      whatsappNumber: '9876543210',
      otp: '012345',
    });

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v25.0/123456789/messages');
    expect(request?.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer meta-access-token' }),
    );
    expect(JSON.parse(request?.body as string)).toEqual(
      expect.objectContaining({
        messaging_product: 'whatsapp',
        to: '919876543210',
        template: {
          name: 'login_otp',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: '012345' }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: '012345' }],
            },
          ],
        },
      }),
    );
  });

  it('does not expose Meta response details when delivery is rejected', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{"error":{"message":"sensitive provider detail"}}', {
        status: 400,
      }),
    );
    const service = new MetaCloudMessageService(config);

    await expect(
      service.sendOtpMessage({
        whatsappNumber: '9876543210',
        otp: '123456',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
