import { OfferingsService } from './offerings.service';

describe('OfferingsService image delivery', () => {
  it('returns an ImageKit card image and does not expose the stored key', async () => {
    const offering = {
      id: 'offering-id',
      slug: 'flowers',
      imageKey: 'offerings/flowers.webp',
      templeAmount: 60,
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      zohoItemId: null,
      zohoSyncStatus: 'PENDING',
      zohoSyncError: null,
      lastZohoSyncAt: null,
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
      {} as never,
    );

    const response = await service.getOfferingDetails('offering-id');

    expect(response).toEqual({
      id: 'offering-id',
      slug: 'flowers',
      templeAmount: 60,
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      zohoItemId: null,
      zohoSyncStatus: 'PENDING',
      zohoSyncError: null,
      lastZohoSyncAt: null,
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

  it('creates a vendor-neutral Zoho item after local offering creation', async () => {
    const createdAt = new Date();
    const createdOffering = {
      id: 'offering-id',
      slug: 'flowers',
      imageKey: 'offerings/flowers.webp',
      templeAmount: 60,
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      zohoItemId: null,
      zohoSyncStatus: 'PENDING',
      zohoSyncError: null,
      lastZohoSyncAt: null,
      createdAt,
      updatedAt: createdAt,
      translations: [
        { language: 'EN', name: 'Flowers', description: 'Fresh flowers' },
      ],
      _count: { poojas: 0 },
    };
    const syncedAt = new Date();
    const repository = {
      create: jest.fn().mockResolvedValue(createdOffering),
      update: jest
        .fn()
        .mockResolvedValueOnce(createdOffering)
        .mockResolvedValueOnce({
          ...createdOffering,
          zohoItemId: 'zoho-offering-item-id',
          zohoSyncStatus: 'SYNCED',
          lastZohoSyncAt: syncedAt,
        }),
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('offerings/flowers.webp'),
      queueDeleteFile: jest.fn(),
    };
    const imageService = { getCardImage: jest.fn().mockReturnValue(null) };
    const zohoBooksService = {
      createItem: jest
        .fn()
        .mockResolvedValue({ itemId: 'zoho-offering-item-id' }),
      updateItem: jest.fn(),
    };
    const service = new OfferingsService(
      repository as never,
      fileStorageService as never,
      imageService as never,
      zohoBooksService as never,
    );

    const response = await service.createOffering(
      {
        templeAmount: 60,
        actualPrice: 100,
        discountPrice: 80,
        isActive: true,
        translations: [
          {
            language: 'EN',
            name: 'Flowers',
            description: 'Fresh flowers',
          },
        ],
      },
      { buffer: Buffer.from('image') } as never,
    );

    expect(zohoBooksService.createItem).toHaveBeenCalledWith({
      offeringId: 'offering-id',
      name: 'Flowers',
      description: 'Fresh flowers',
      sellingPrice: 80,
      purchasePrice: 60,
    });
    expect(response).toMatchObject({
      id: 'offering-id',
      zohoItemId: 'zoho-offering-item-id',
      zohoSyncStatus: 'SYNCED',
      lastZohoSyncAt: syncedAt,
    });
  });

  it('updates the existing Zoho offering item when pricing changes', async () => {
    const existing = {
      id: 'offering-id',
      slug: 'flowers',
      imageKey: 'offerings/flowers.webp',
      templeAmount: 60,
      actualPrice: 100,
      discountPrice: 80,
      isActive: true,
      deletedAt: null,
      zohoItemId: 'zoho-offering-item-id',
      zohoSyncStatus: 'SYNCED',
      zohoSyncError: null,
      lastZohoSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [
        { language: 'EN', name: 'Flowers', description: 'Fresh flowers' },
      ],
      _count: { poojas: 0 },
    };
    const updated = { ...existing, templeAmount: 65, discountPrice: 85 };
    const repository = {
      findById: jest.fn().mockResolvedValue(existing),
      update: jest
        .fn()
        .mockResolvedValueOnce(updated)
        .mockResolvedValueOnce(updated)
        .mockResolvedValueOnce({
          ...updated,
          zohoSyncStatus: 'SYNCED',
          zohoSyncError: null,
        }),
    };
    const zohoBooksService = {
      createItem: jest.fn(),
      updateItem: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OfferingsService(
      repository as never,
      { uploadFile: jest.fn(), queueDeleteFile: jest.fn() } as never,
      { getCardImage: jest.fn().mockReturnValue(null) } as never,
      zohoBooksService as never,
    );

    await service.updateOffering('offering-id', {
      templeAmount: 65,
      discountPrice: 85,
    });

    expect(zohoBooksService.updateItem).toHaveBeenCalledWith({
      offeringId: 'offering-id',
      itemId: 'zoho-offering-item-id',
      name: 'Flowers',
      description: 'Fresh flowers',
      sellingPrice: 85,
      purchasePrice: 65,
    });
    expect(zohoBooksService.createItem).not.toHaveBeenCalled();
  });
});
