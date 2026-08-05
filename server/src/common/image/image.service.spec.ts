import { ImageService } from './image.service';

describe('ImageService', () => {
  const values: Record<string, string> = {
    IMAGEKIT_URL_ENDPOINT: 'https://cdn.yaagam.in/',
    IMAGEKIT_PUBLIC_KEY: 'public-key',
    IMAGEKIT_PRIVATE_KEY: 'private-key',
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => values[key]),
  };
  let service: ImageService;

  beforeEach(() => {
    configService.getOrThrow.mockClear();
    service = new ImageService(configService as never);
  });

  it('reads all ImageKit environment variables and builds a public URL', () => {
    expect(service.getPublicUrl('/temples/main image.webp/')).toBe(
      'https://cdn.yaagam.in/temples/main%20image.webp',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'IMAGEKIT_URL_ENDPOINT',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'IMAGEKIT_PUBLIC_KEY',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'IMAGEKIT_PRIVATE_KEY',
    );
  });

  it('centralizes thumbnail, card, banner, avatar, and original presets', () => {
    expect(service.getThumbnail('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:w-300,h-300,q-80,f-webp,c-maintain_ratio,fo-center/images/a.webp',
    );
    expect(service.getCardImage('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:w-600,h-400,q-80,f-webp,c-maintain_ratio,fo-center/images/a.webp',
    );
    expect(service.getBannerImage('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:w-1600,h-900,q-90,f-webp,c-maintain_ratio,fo-center/images/a.webp',
    );
    expect(service.getAvatar('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:w-200,h-200,q-80,f-webp,c-maintain_ratio,fo-face/images/a.webp',
    );
    expect(service.getOriginal('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:f-auto/images/a.webp',
    );
  });

  it('builds validated custom transformations without leaking syntax', () => {
    expect(
      service.getTransformedUrl('images/a.jpg', {
        width: 720,
        height: 480,
        quality: 75,
        format: 'avif',
        fit: 'contain',
        crop: 'top',
        blur: 5,
      }),
    ).toBe(
      'https://cdn.yaagam.in/tr:w-720,h-480,q-75,f-avif,c-at_max,fo-top,bl-5/images/a.jpg',
    );
  });

  it('returns null for an absent key and rejects invalid numeric options', () => {
    expect(service.getPublicUrl(null)).toBeNull();
    expect(service.getCardImage('')).toBeNull();
    expect(() =>
      service.getTransformedUrl('images/a.jpg', { quality: 101 }),
    ).toThrow(RangeError);
  });

  it('rejects a non-HTTPS ImageKit endpoint', () => {
    const invalidConfig = {
      getOrThrow: jest.fn((key: string) =>
        key === 'IMAGEKIT_URL_ENDPOINT' ? 'http://cdn.test' : 'key',
      ),
    };

    expect(() => new ImageService(invalidConfig as never)).toThrow(
      'IMAGEKIT_URL_ENDPOINT must be an HTTPS URL',
    );
  });
});
