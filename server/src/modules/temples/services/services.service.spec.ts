import { Test, TestingModule } from '@nestjs/testing';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const prismaService = {
    temple: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const fileStorageService = {
    createSecureUrl: jest.fn(),
  };

  beforeEach(async () => {
    prismaService.temple.findMany.mockReset();
    prismaService.temple.count.mockReset();
    fileStorageService.createSecureUrl.mockReset();
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
      include: { translations: true },
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
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(prismaService.temple.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });
});
