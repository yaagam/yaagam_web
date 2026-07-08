/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    time: '06:30',
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
        where: { AND: [{ isWeekly: true }] },
      }),
    );
    expect(prismaService.pooja.count).toHaveBeenCalledWith({
      where: { AND: [{ isWeekly: true }] },
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
        where: undefined,
      }),
    );
    expect(prismaService.pooja.count).toHaveBeenCalledWith({
      where: undefined,
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
        time: '06:30',
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
      createSecureUrl: jest.fn().mockResolvedValue(null),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(service.deletePooja('pooja-id')).resolves.toEqual({
      ...deletedPooja,
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
