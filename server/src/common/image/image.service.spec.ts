import { ImageService } from './image.service';

describe('ImageService', () => {
  const values: Record<string, string> = {
    IMAGEKIT_URL_ENDPOINT: 'https://cdn.yaagam.in/',
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => values[key]),
  };
  let service: ImageService;

  beforeEach(() => {
    configService.getOrThrow.mockClear();
    service = new ImageService(configService as never);
  });

  it('reads the ImageKit endpoint and builds a public URL', () => {
    expect(service.getPublicUrl('/temples/main image.webp/')).toBe(
      'https://cdn.yaagam.in/temples/main%20image.webp',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'IMAGEKIT_URL_ENDPOINT',
    );
  });

  it('centralizes every optimized image preset', () => {
    expect(service.getThumbnail('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:w-120,q-auto,f-auto/images/a.webp',
    );
    expect(service.getAvatar('images/a.webp')).toContain(
      '/tr:w-200,h-200,q-auto,f-auto,c-maintain_ratio,fo-face/',
    );
    expect(service.getCardImage('images/a.webp')).toContain(
      '/tr:w-500,h-350,q-auto,f-auto,c-maintain_ratio,fo-center/',
    );
    expect(service.getHeroImage('images/a.webp')).toContain(
      '/tr:w-1600,h-900,q-auto,f-auto,c-maintain_ratio,fo-center/',
    );
    expect(service.getGalleryImage('images/a.webp')).toContain(
      '/tr:w-1200,q-auto,f-auto,c-at_max/',
    );
    expect(service.getBannerImage('images/a.webp')).toContain(
      '/tr:w-1600,h-600,q-auto,f-auto,c-maintain_ratio,fo-center/',
    );
    expect(service.getBlogCover('images/a.webp')).toContain(
      '/tr:w-1200,h-630,q-auto,f-auto,c-maintain_ratio,fo-center/',
    );
    expect(service.getOriginal('images/a.webp')).toBe(
      'https://cdn.yaagam.in/tr:q-auto,f-auto/images/a.webp',
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
