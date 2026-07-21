import { Language } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const templeSelect = {
    id: true,
    imageKey: true,
    state: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    translations: true,
  } as const;
  const prismaService = {
    temple: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  };
  const fileStorageService = {
    createSecureUrl: jest.fn(),
    uploadFile: jest.fn(),
    queueDeleteFile: jest.fn(),
  };

  beforeEach(async () => {
    prismaService.temple.findMany.mockReset();
    prismaService.temple.count.mockReset();
    prismaService.temple.create.mockReset();
    fileStorageService.createSecureUrl.mockReset();
    fileStorageService.uploadFile.mockReset();
    fileStorageService.queueDeleteFile.mockReset();
    fileStorageService.createSecureUrl.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: FILE_STORAGE_SERVICE, useValue: fileStorageService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('fetches temples with translations', async () => {
    const temples = [
      {
        id: 'temple-id',
        imageKey: 'temples/image.jpg',
        email: 'guruvayur@example.com',
        state: 'Kerala',
        description: 'Historic temple',
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
      },
    ];
    prismaService.temple.findMany.mockResolvedValue(temples);
    prismaService.temple.count.mockResolvedValue(1);
    fileStorageService.createSecureUrl.mockResolvedValue(
      'https://signed.example/temples/image.jpg',
    );

    await expect(service.getTemples({ page: 1, limit: 10 })).resolves.toEqual({
      items: [
        {
          id: 'temple-id',
          imageKey: 'temples/image.jpg',
          state: 'Kerala',
          description: 'Historic temple',
          createdAt: temples[0].createdAt,
          updatedAt: temples[0].updatedAt,
          translations: [],
          imageUrl: 'https://signed.example/temples/image.jpg',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    expect(prismaService.temple.findMany).toHaveBeenCalledWith({
      where: undefined,
      select: templeSelect,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
    expect(prismaService.temple.count).toHaveBeenCalledWith({
      where: undefined,
    });
    expect(fileStorageService.createSecureUrl).toHaveBeenCalledWith(
      'temples/image.jpg',
    );
  });

  it('creates a temple from flat admin form fields', async () => {
    const createdAt = new Date();
    const updatedAt = new Date();
    const temple = {
      id: 'temple-id',
      imageKey: null,
      email: 'temple@example.com',
      state: 'Kerala',
      description: 'Temple description',
      createdAt,
      updatedAt,
      translations: [
        {
          id: 'translation-id',
          templeId: 'temple-id',
          language: Language.EN,
          name: 'Temple name',
          district: 'Thrissur',
          place: 'Guruvayur',
          description: 'Temple description',
        },
      ],
    };
    prismaService.temple.create.mockResolvedValue(temple);

    await expect(
      service.createTemple({
        email: 'temple@example.com',
        state: 'Kerala',
        description: 'Temple description',
        name: 'Temple name',
        district: 'Thrissur',
        place: 'Guruvayur',
      }),
    ).resolves.toEqual({
      id: 'temple-id',
      imageKey: null,
      state: 'Kerala',
      description: 'Temple description',
      createdAt,
      updatedAt,
      translations: temple.translations,
      imageUrl: null,
    });
    expect(prismaService.temple.create).toHaveBeenCalledWith({
      data: {
        email: 'temple@example.com',
        state: 'Kerala',
        description: 'Temple description',
        imageKey: undefined,
        translations: {
          create: [
            {
              language: Language.EN,
              name: 'Temple name',
              district: 'Thrissur',
              place: 'Guruvayur',
              description: 'Temple description',
            },
          ],
        },
      },
      select: templeSelect,
    });
  });
  it('searches public temple fields and paginates results', async () => {
    prismaService.temple.findMany.mockResolvedValue([]);
    prismaService.temple.count.mockResolvedValue(12);

    await service.getTemples({ page: 2, limit: 5, search: 'guruvayur' });

    const expectedWhere = {
      OR: [
        { state: { contains: 'guruvayur', mode: 'insensitive' } },
        {
          description: { contains: 'guruvayur', mode: 'insensitive' },
        },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: 'guruvayur', mode: 'insensitive' } },
                { district: { contains: 'guruvayur', mode: 'insensitive' } },
                { place: { contains: 'guruvayur', mode: 'insensitive' } },
                {
                  description: {
                    contains: 'guruvayur',
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },
      ],
    };

    expect(prismaService.temple.findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      select: templeSelect,
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(prismaService.temple.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });
});
