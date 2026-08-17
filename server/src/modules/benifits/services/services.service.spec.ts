import { Language } from '@prisma/client';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  interface ServiceMocks {
    prismaService?: Record<string, unknown>;
    fileStorageService?: {
      uploadFile: jest.Mock;
      queueDeleteFile: jest.Mock;
    };
    imageService?: { getThumbnail: jest.Mock };
  }

  function createService({
    prismaService = { benefit: {} },
    fileStorageService = {
      uploadFile: jest.fn(),
      queueDeleteFile: jest.fn(),
    },
    imageService = { getThumbnail: jest.fn().mockReturnValue(null) },
  }: ServiceMocks = {}) {
    return new ServicesService(
      prismaService as never,
      fileStorageService as never,
      imageService as never,
    );
  }

  it('fetches benifits with translations and pagination metadata', async () => {
    const benifits = [
      {
        id: 'benefit-id',
        imageKey: 'benifits/image.jpg',
        translations: [
          {
            language: Language.EN,
            name: 'Prosperity',
            description: 'Growth and wellbeing',
          },
        ],
      },
    ];
    const prismaService = {
      benefit: {
        findMany: jest.fn().mockResolvedValue(benifits),
        count: jest.fn().mockResolvedValue(12),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn(),
      queueDeleteFile: jest.fn(),
    };
    const imageService = {
      getThumbnail: jest
        .fn()
        .mockReturnValue('https://cdn.example/thumbnail/benifits/image.jpg'),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
    });

    await expect(
      service.getBenifits({ page: 2, limit: 10, search: ' prosperity ' }),
    ).resolves.toEqual({
      items: [
        {
          id: 'benefit-id',
          translations: benifits[0].translations,
          imageUrl: 'https://cdn.example/thumbnail/benifits/image.jpg',
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 12,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    });
    expect(prismaService.benefit.findMany).toHaveBeenCalledWith({
      where: {
        translations: {
          some: {
            OR: [
              { name: { contains: 'prosperity', mode: 'insensitive' } },
              {
                description: {
                  contains: 'prosperity',
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      },
      include: {
        translations: true,
        poojas: { include: { translations: true } },
        _count: { select: { poojas: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(prismaService.benefit.count).toHaveBeenCalledWith({
      where: {
        translations: {
          some: {
            OR: [
              { name: { contains: 'prosperity', mode: 'insensitive' } },
              {
                description: {
                  contains: 'prosperity',
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      },
    });
  });

  it('uploads an image when creating a benifit', async () => {
    const input = {
      translations: [
        {
          language: Language.EN,
          name: 'Prosperity',
          description: 'Growth and wellbeing',
        },
      ],
    };
    const image = { originalname: 'image.jpg' };
    const createdBenifit = {
      id: 'benefit-id',
      imageKey: 'benifits/image.jpg',
      translations: input.translations,
    };
    const prismaService = {
      benefit: {
        create: jest.fn().mockResolvedValue(createdBenifit),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('benifits/image.jpg'),
      queueDeleteFile: jest.fn(),
    };
    const imageService = {
      getThumbnail: jest.fn().mockReturnValue('https://cdn.example/thumbnail'),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
    });

    await expect(service.createBenifit(input, image as never)).resolves.toEqual(
      {
        id: 'benefit-id',
        translations: input.translations,
        imageUrl: 'https://cdn.example/thumbnail',
      },
    );
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
      image,
      'benifits',
      'prosperity',
    );
    expect(prismaService.benefit.create).toHaveBeenCalledWith({
      data: {
        slug: 'prosperity',
        imageKey: 'benifits/image.jpg',
        translations: { create: input.translations },
      },
      include: { translations: true },
    });
  });

  it('returns translations, descriptions, image URL, and pooja count in detail', async () => {
    const benifit = {
      id: 'benefit-id',
      slug: 'prosperity',
      imageKey: 'benifits/image.jpg',
      translations: [
        {
          language: Language.EN,
          name: 'Prosperity',
          description: 'Growth and wellbeing',
        },
      ],
      _count: { poojas: 2 },
    };
    const prismaService = {
      benefit: { findUnique: jest.fn().mockResolvedValue(benifit) },
    };
    const fileStorageService = {
      uploadFile: jest.fn(),
      queueDeleteFile: jest.fn(),
    };
    const imageService = {
      getThumbnail: jest.fn().mockReturnValue('https://cdn.example/thumbnail'),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
    });

    await expect(service.getBenifitDetails('benefit-id')).resolves.toEqual({
      id: 'benefit-id',
      slug: 'prosperity',
      translations: benifit.translations,
      _count: { poojas: 2 },
      imageUrl: 'https://cdn.example/thumbnail',
    });
    expect(prismaService.benefit.findUnique).toHaveBeenCalledWith({
      where: { id: 'benefit-id' },
      include: {
        translations: true,
        _count: { select: { poojas: true } },
      },
    });
  });

  it('queues the old image for deletion after updating with a new image', async () => {
    const input = {
      translations: [
        {
          language: Language.EN,
          name: 'Peace',
          description: 'Calm and clarity',
        },
      ],
    };
    const prismaService = {
      benefit: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ imageKey: 'old.jpg', slug: 'prosperity' }),
        update: jest.fn().mockResolvedValue({
          id: 'benefit-id',
          imageKey: 'new.jpg',
          translations: input.translations,
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('new.jpg'),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const imageService = {
      getThumbnail: jest.fn().mockReturnValue('https://cdn.example/thumbnail'),
    };
    const service = createService({
      prismaService,
      fileStorageService,
      imageService,
    });

    await service.updateBenifit('benefit-id', input, {
      originalname: 'new.jpg',
    } as never);

    expect(prismaService.benefit.update).toHaveBeenCalledWith({
      where: { id: 'benefit-id' },
      data: {
        imageKey: 'new.jpg',
        translations: {
          upsert: [
            {
              where: {
                benefitId_language: {
                  benefitId: 'benefit-id',
                  language: Language.EN,
                },
              },
              create: input.translations[0],
              update: {
                name: 'Peace',
                description: 'Calm and clarity',
              },
            },
          ],
        },
      },
      include: { translations: true },
    });
    expect(fileStorageService.queueDeleteFile).toHaveBeenCalledWith('old.jpg');
  });

  it('rejects deletion when a benifit is linked to poojas', async () => {
    const prismaService = {
      benefit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'benefit-id',
          imageKey: null,
          translations: [],
          _count: { poojas: 1 },
        }),
        delete: jest.fn(),
      },
    };
    const service = createService({ prismaService });

    await expect(service.deleteBenifit('benefit-id')).rejects.toMatchObject({
      message: 'Benifit cannot be deleted because it is connected to a pooja',
    });
    expect(prismaService.benefit.delete).not.toHaveBeenCalled();
  });
});
