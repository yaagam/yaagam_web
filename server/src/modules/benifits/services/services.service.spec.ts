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
    prismaService = { benefit: {} },
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
      createSecureUrl: jest
        .fn()
        .mockResolvedValue('https://signed.example/benifits/image.jpg'),
      queueDeleteFile: jest.fn(),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(
      service.getBenifits({ page: 2, limit: 10, search: ' prosperity ' }),
    ).resolves.toEqual({
      items: [
        {
          ...benifits[0],
          imageUrl: 'https://signed.example/benifits/image.jpg',
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
      include: { translations: true },
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
      createSecureUrl: jest.fn().mockResolvedValue('https://signed.example'),
      queueDeleteFile: jest.fn(),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(service.createBenifit(input, image as never)).resolves.toEqual(
      {
        ...createdBenifit,
        imageUrl: 'https://signed.example',
      },
    );
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
      image,
      'benifits',
    );
    expect(prismaService.benefit.create).toHaveBeenCalledWith({
      data: {
        imageKey: 'benifits/image.jpg',
        translations: { create: input.translations },
      },
      include: { translations: true },
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
        findUnique: jest.fn().mockResolvedValue({ imageKey: 'old.jpg' }),
        update: jest.fn().mockResolvedValue({
          id: 'benefit-id',
          imageKey: 'new.jpg',
          translations: input.translations,
        }),
      },
    };
    const fileStorageService = {
      uploadFile: jest.fn().mockResolvedValue('new.jpg'),
      createSecureUrl: jest.fn().mockResolvedValue('https://signed.example'),
      queueDeleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ prismaService, fileStorageService });

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
