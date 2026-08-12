/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  interface ServiceMocks {
    prismaService?: Record<string, unknown>;
    fileStorageService?: {
      uploadFile: jest.Mock;
      queueDeleteFile: jest.Mock;
    };
    imageService?: {
      getCardImage: jest.Mock;
      getGalleryImage: jest.Mock;
      getThumbnail: jest.Mock;
    };
    zohoBooksService?: {
      createItem: jest.Mock;
      updateItem: jest.Mock;
    };
  }

  function createService({
    prismaService = { pooja: {} },
    fileStorageService = {
      uploadFile: jest.fn(),
      queueDeleteFile: jest.fn(),
    },
    imageService = {
      getCardImage: jest.fn().mockReturnValue(null),
      getGalleryImage: jest.fn().mockReturnValue(null),
      getThumbnail: jest.fn().mockReturnValue(null),
    },
    zohoBooksService = {
      createItem: jest.fn().mockResolvedValue({ itemId: 'zoho-item-id' }),
      updateItem: jest.fn().mockResolvedValue(undefined),
    },
  }: ServiceMocks = {}) {
    return new ServicesService(
      prismaService as never,
      fileStorageService as never,
      imageService as never,
      zohoBooksService as never,
    );
  }

  const input = {
    templeId: 'temple-id',
    templeAmount: 400,
    baseAmount: 600,
    discountAmount: 500,
    poojaDay: 'MONDAY',
    time: '06:30',
    isWeekly: false,
    recommendedWeeks: 3,
    benefitIds: ['benefit-id'],
    translations: [
      {
        language: Language.EN,
        name: 'Ganapathi Homam',
        about: 'Special pooja',
        poojaFor: 'Peace of Mind',
      },
    ],
  };

  const image = {
    buffer: Buffer.from('image'),
    mimetype: 'image/jpeg',
    originalname: 'pooja.jpg',
  };

  it('filters weekly poojas by weekly availability', async () => {
    const prismaService = {
      pooja: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = createService({ prismaService });

    await service.getPoojas({ page: 1, limit: 10, category: 'weekly' });

    expect(prismaService.pooja.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { isActive: true },
            { zohoSyncStatus: 'SYNCED' },
            { temple: { isActive: true } },
            { isWeekly: true },
          ],
        },
      }),
    );
    expect(prismaService.pooja.count).toHaveBeenCalledWith({
      where: {
        AND: [
          { isActive: true },
          { zohoSyncStatus: 'SYNCED' },
          { temple: { isActive: true } },
          { isWeekly: true },
        ],
      },
    });
  });

  it('does not exclude weekly-capable poojas from normal pooja results', async () => {
    const prismaService = {
      pooja: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = createService({ prismaService });

    await service.getPoojas({ page: 1, limit: 10, category: 'normal' });

    expect(prismaService.pooja.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { isActive: true },
            { zohoSyncStatus: 'SYNCED' },
            { temple: { isActive: true } },
          ],
        },
      }),
    );
    expect(prismaService.pooja.count).toHaveBeenCalledWith({
      where: {
        AND: [
          { isActive: true },
          { zohoSyncStatus: 'SYNCED' },
          { temple: { isActive: true } },
        ],
      },
    });
  });
  it('requires at least one image when creating a pooja', async () => {
    const service = createService();

    await expect(service.createPooja(input, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects more than four images when creating a pooja', async () => {
    const service = createService();

    await expect(
      service.createPooja(input, [image, image, image, image, image]),
    ).rejects.toMatchObject({
      message: 'Pooja can have a maximum of 4 images',
    });
  });

  it('uploads images and creates a pooja with required details', async () => {
    const createdPooja = {
      id: 'pooja-id',
      imageKeys: ['poojas/one.jpg'],
      translations: input.translations,
      benefits: [],
      slug: 'ganapathi-homam',
      templeAmount: 400,
      baseAmount: 600,
      discountAmount: 500,
      zohoItemId: null,
      zohoSyncStatus: 'PENDING',
      zohoSyncError: null,
      lastZohoSyncAt: null,
      temple: {
        email: 'confidential@example.com',
        zohoVendorId: 'vendor-id',
        translations: [],
      },
    };
    const prismaService = {
      pooja: {
        create: jest.fn().mockResolvedValue(createdPooja),
        update: jest.fn().mockResolvedValue({
          ...createdPooja,
          zohoItemId: 'zoho-item-id',
          zohoSyncStatus: 'SYNCED',
          lastZohoSyncAt: new Date(),
          offerings: [],
          _count: { bookings: 0 },
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('poojas/one.jpg'),
      queueDeleteFile: jest.fn(),
    };
    const zohoBooksService = {
      createItem: jest.fn().mockResolvedValue({ itemId: 'zoho-item-id' }),
      updateItem: jest.fn(),
    };
    const imageService = {
      getCardImage: jest.fn().mockReturnValue('https://cdn.example/card/one'),
      getGalleryImage: jest.fn().mockReturnValue(null),
      getThumbnail: jest.fn().mockReturnValue(null),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
      zohoBooksService,
    });

    await expect(service.createPooja(input, [image])).resolves.toEqual({
      id: 'pooja-id',
      slug: 'ganapathi-homam',
      templeAmount: 400,
      baseAmount: 600,
      discountAmount: 500,
      translations: input.translations,
      benefits: [],
      offerings: [],
      temple: { translations: [], imageUrl: null },
      imageUrls: ['https://cdn.example/card/one'],
      zohoItemId: 'zoho-item-id',
      zohoSyncStatus: 'SYNCED',
      zohoSyncError: null,
      lastZohoSyncAt: expect.any(Date),
    });
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
      image,
      'poojas',
      'ganapathi-homam',
    );
    expect(zohoBooksService.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        poojaId: 'pooja-id',
        vendorId: 'vendor-id',
        sellingPrice: 500,
        purchasePrice: 400,
      }),
    );
    expect(prismaService.pooja.create).toHaveBeenCalledWith({
      data: {
        slug: 'ganapathi-homam',
        templeId: 'temple-id',
        templeAmount: 400,
        baseAmount: 600,
        discountAmount: 500,
        imageKeys: ['poojas/one.jpg'],
        poojaDay: 'MONDAY',
        time: '06:30',
        isWeekly: false,
        recommendedWeeks: 3,
        recommendedWeeks: 3,
        benefits: { connect: [{ id: 'benefit-id' }] },
        offerings: undefined,
        translations: { create: input.translations },
      },
      include: expect.any(Object),
    });
  });

  it('connects parsed offering IDs when creating a pooja', async () => {
    const createdPooja = {
      id: 'pooja-id',
      slug: 'ganapathi-homam',
      templeAmount: 400,
      baseAmount: 600,
      discountAmount: 500,
      imageKeys: ['poojas/one.jpg'],
      translations: input.translations,
      benefits: [],
      offerings: [],
      temple: { zohoVendorId: 'vendor-id', translations: [] },
      zohoItemId: null,
      zohoSyncStatus: 'PENDING',
      zohoSyncError: null,
      lastZohoSyncAt: null,
    };
    const prismaService = {
      offering: { count: jest.fn().mockResolvedValue(2) },
      pooja: {
        create: jest.fn().mockResolvedValue(createdPooja),
        update: jest.fn().mockResolvedValue({
          ...createdPooja,
          zohoItemId: 'zoho-item-id',
          zohoSyncStatus: 'SYNCED',
          lastZohoSyncAt: new Date(),
          _count: { bookings: 0 },
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('poojas/one.jpg'),
      queueDeleteFile: jest.fn(),
    };
    const service = createService({ prismaService, fileStorageService });

    await service.createPooja(
      { ...input, offeringIds: ['offering-1', 'offering-2'] },
      [image],
    );

    expect(prismaService.pooja.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          offerings: {
            connect: [{ id: 'offering-1' }, { id: 'offering-2' }],
          },
        }),
      }),
    );
  });

  it('returns the complete pooja detail relations and booking count', async () => {
    const pooja = {
      id: 'pooja-id',
      templeAmount: 400,
      baseAmount: 600,
      discountAmount: 500,
      imageKeys: ['poojas/one.jpg'],
      translations: input.translations,
      benefits: [
        { id: 'benefit-id', imageKey: 'benefits/one.webp', translations: [] },
      ],
      offerings: [
        {
          id: 'offering-id',
          imageKey: 'offerings/one.webp',
          templeAmount: 60,
          zohoItemId: 'private-zoho-item-id',
          zohoSyncStatus: 'SYNCED',
          zohoSyncError: null,
          lastZohoSyncAt: new Date(),
          translations: [],
        },
      ],
      temple: {
        id: 'temple-id',
        imageKey: 'temples/one.webp',
        translations: [],
      },
      _count: { bookings: 4 },
    };
    const prismaService = {
      pooja: { findUnique: jest.fn().mockResolvedValue(pooja) },
    };
    const service = createService({ prismaService });

    await expect(service.getPoojaDetails('pooja-id')).resolves.toEqual({
      id: 'pooja-id',
      templeAmount: 400,
      baseAmount: 600,
      discountAmount: 500,
      translations: input.translations,
      benefits: [{ id: 'benefit-id', translations: [], imageUrl: null }],
      offerings: [{ id: 'offering-id', translations: [], imageUrl: null }],
      temple: { id: 'temple-id', translations: [], imageUrl: null },
      _count: { bookings: 4 },
      imageUrls: [],
    });
    expect(prismaService.pooja.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pooja-id' },
        include: expect.objectContaining({
          translations: true,
          benefits: expect.any(Object),
          offerings: expect.any(Object),
          temple: expect.any(Object),
          _count: { select: { bookings: true } },
        }),
      }),
    );
  });

  it('replaces only selected image slots and preserves remaining keys', async () => {
    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({
          imageKeys: ['keep.jpg', 'old.jpg'],
          templeAmount: 400,
          baseAmount: 600,
          discountAmount: 500,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'pooja-id',
          imageKeys: ['keep.jpg', 'new.jpg'],
          translations: [],
          benefits: [],
          temple: { translations: [] },
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('new.jpg'),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const imageService = {
      getCardImage: jest.fn().mockReturnValue('https://cdn.example/card/new'),
      getGalleryImage: jest.fn().mockReturnValue(null),
      getThumbnail: jest.fn().mockReturnValue(null),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
    });

    await service.updatePooja(
      'pooja-id',
      { poojaDay: 'TUESDAY', imageSlots: [1] },
      [image],
    );

    expect(prismaService.pooja.update).toHaveBeenCalledWith({
      where: { id: 'pooja-id' },
      data: expect.objectContaining({
        imageKeys: ['keep.jpg', 'new.jpg'],
        poojaDay: 'TUESDAY',
      }),
      include: expect.any(Object),
    });
    expect(fileStorageService.queueDeleteFile).toHaveBeenCalledWith('old.jpg');
  });

  it('deletes a pooja even when bookings have snapshot data', async () => {
    const deletedPooja = {
      id: 'pooja-id',
      imageKeys: ['poojas/old.jpg'],
      translations: [],
      benefits: [],
      temple: { translations: [] },
    };
    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({
          ...deletedPooja,
          _count: { bookings: 1 },
        }),
        delete: jest.fn().mockResolvedValue(deletedPooja),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn(),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(service.deletePooja('pooja-id')).resolves.toEqual({
      id: 'pooja-id',
      translations: [],
      benefits: [],
      offerings: [],
      temple: { translations: [], imageUrl: null },
      imageUrls: [],
    });
    expect(prismaService.pooja.delete).toHaveBeenCalledWith({
      where: { id: 'pooja-id' },
      include: expect.any(Object),
    });
    expect(fileStorageService.queueDeleteFile).toHaveBeenCalledWith(
      'poojas/old.jpg',
    );
  });
});
