/* eslint-disable @typescript-eslint/require-await */
import { ConfigService } from '@nestjs/config';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(() => {
    configService.get.mockReset();
    configService.getOrThrow.mockReset();
    configService.get.mockImplementation((key: string) =>
      key === 'GOOGLE_TRANSLATE_API_URL'
        ? 'https://translation.example/language/translate/v2'
        : undefined,
    );
    configService.getOrThrow.mockReturnValue('google-api-key');

    global.fetch = jest.fn(async (_url, init?: RequestInit) => {
      const rawBody = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(rawBody) as {
        q: string[];
        target: string;
      };

      return {
        ok: true,
        json: async () => ({
          data: {
            translations: body.q.map((text) => ({
              translatedText: `${body.target}:${text}`,
            })),
          },
        }),
      } as Response;
    });
  });

  it('translates nested json string values into configured languages', async () => {
    const service = new TranslationService(
      configService as unknown as ConfigService,
    );

    await expect(
      service.translateJson({
        sourceLanguage: 'en',
        data: {
          name: 'Temple name',
          details: { district: 'Thrissur' },
          tags: ['Krishna', 108],
          imageKey: null,
        },
      }),
    ).resolves.toEqual({
      malayalam: {
        name: 'ml:Temple name',
        details: { district: 'ml:Thrissur' },
        tags: ['ml:Krishna', 108],
        imageKey: null,
      },
      hindi: {
        name: 'hi:Temple name',
        details: { district: 'hi:Thrissur' },
        tags: ['hi:Krishna', 108],
        imageKey: null,
      },
      marathi: {
        name: 'mr:Temple name',
        details: { district: 'mr:Thrissur' },
        tags: ['mr:Krishna', 108],
        imageKey: null,
      },
      tamil: {
        name: 'ta:Temple name',
        details: { district: 'ta:Thrissur' },
        tags: ['ta:Krishna', 108],
        imageKey: null,
      },
    });
  });
});
