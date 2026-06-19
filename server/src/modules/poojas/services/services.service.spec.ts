import { BadRequestException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  interface ServiceMocks {
    prismaService?: Record<string, unknown>;
    fileStorageService?: {
      uploadFile: jest.Mock;
      createSecureUrl: jest.Mock;
      queueDeleteFile: jest.Mock;
    };
  }

  function createService({
    prismaService = { pooja: {} },
    fileStorageService = {
      uploadFile: jest.fn(),
      createSecureUrl: jest.fn().mockResolvedValue(null),
      queueDeleteFile: jest.fn(),
    },
  }: ServiceMocks = {}) {
    return new ServicesService(
      prismaService as never,
      fileStorageService as never,
    );
  }

  const input = {
    templeId: 'temple-id',
    baseAmount: 500,
    poojaDay: 'MONDAY',
    isWeekly: false,
    weeklyDiscount: 10,
    normalDiscount: 0,
    benefitIds: ['benefit-id'],
    translations: [
      {
        language: Language.EN,
        name: 'Ganapathi Homam',
        about: 'Special pooja',
      },
    ],
  };

  const image = {
    buffer: Buffer.from('image'),
    mimetype: 'image/jpeg',
    originalname: 'pooja.jpg',
  };

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
      temple: { translations: [] },
    };
    const prismaService = {
      pooja: {
        create: jest.fn().mockResolvedValue(createdPooja),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('poojas/one.jpg'),
      createSecureUrl: jest
        .fn()
        .mockResolvedValue('https://signed.example/one'),
      queueDeleteFile: jest.fn(),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(service.createPooja(input, [image])).resolves.toEqual({
      ...createdPooja,
      imageUrls: ['https://signed.example/one'],
    });
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(image, 'poojas');
    expect(prismaService.pooja.create).toHaveBeenCalledWith({
      data: {
        templeId: 'temple-id',
        baseAmount: 500,
        imageKeys: ['poojas/one.jpg'],
        poojaDay: 'MONDAY',
        isWeekly: false,
        weeklyDiscount: 10,
        normalDiscount: 0,
        benefits: { connect: [{ id: 'benefit-id' }] },
        translations: { create: input.translations },
      },
      include: expect.any(Object),
    });
  });

  it('replaces old images after updating with new images', async () => {
    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({ imageKeys: ['old.jpg'] }),
        update: jest.fn().mockResolvedValue({
          id: 'pooja-id',
          imageKeys: ['new.jpg'],
          translations: [],
          benefits: [],
          temple: { translations: [] },
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('new.jpg'),
      createSecureUrl: jest
        .fn()
        .mockResolvedValue('https://signed.example/new'),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ prismaService, fileStorageService });

    await service.updatePooja('pooja-id', { poojaDay: 'TUESDAY' }, [image]);

    expect(prismaService.pooja.update).toHaveBeenCalledWith({
      where: { id: 'pooja-id' },
      data: expect.objectContaining({
        imageKeys: ['new.jpg'],
        poojaDay: 'TUESDAY',
      }),
      include: expect.any(Object),
    });
    expect(fileStorageService.queueDeleteFile).toHaveBeenCalledWith('old.jpg');
  });

  it('rejects deletion when a pooja is linked to bookings', async () => {
    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pooja-id',
          imageKeys: [],
          translations: [],
          benefits: [],
          temple: { translations: [] },
          _count: { bookings: 1 },
        }),
        delete: jest.fn(),
      },
    };
    const service = createService({ prismaService });

    await expect(service.deletePooja('pooja-id')).rejects.toMatchObject({
      message: 'Pooja cannot be deleted because it is connected to a booking',
    });
    expect(prismaService.pooja.delete).not.toHaveBeenCalled();
  });
});
