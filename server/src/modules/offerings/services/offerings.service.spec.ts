import { OfferingsService } from './offerings.service';

describe('OfferingsService image delivery', () => {
  it('returns an ImageKit card image and does not expose the stored key', async () => {
    const offering = {
      id: 'offering-id',
      slug: 'flowers',
      imageKey: 'offerings/flowers.webp',
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [],
      _count: { poojas: 0 },
    };
    const repository = {
      findById: jest.fn().mockResolvedValue(offering),
    };
    const imageService = {
      getCardImage: jest
        .fn()
        .mockReturnValue(
          'https://cdn.yaagam.in/tr:w-300/offerings/flowers.webp',
        ),
    };
    const service = new OfferingsService(
      repository as never,
      {} as never,
      imageService as never,
    );

    const response = await service.getOfferingDetails('offering-id');

    expect(response).toEqual({
      id: 'offering-id',
      slug: 'flowers',
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      createdAt: offering.createdAt,
      updatedAt: offering.updatedAt,
      translations: [],
      _count: { poojas: 0 },
      imageUrl: 'https://cdn.yaagam.in/tr:w-300/offerings/flowers.webp',
    });
    expect(response).not.toHaveProperty('imageKey');
    expect(imageService.getCardImage).toHaveBeenCalledWith(
      'offerings/flowers.webp',
    );
  });
});
