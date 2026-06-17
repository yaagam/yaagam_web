import { Test, TestingModule } from '@nestjs/testing';
import PrismaService from '../../../prisma/prisma.service';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const prismaService = {
    temple: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    prismaService.temple.findMany.mockReset();
    prismaService.temple.count.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaService },
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
        imageKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
      },
    ];
    prismaService.temple.findMany.mockResolvedValue(temples);
    prismaService.temple.count.mockResolvedValue(1);

    await expect(service.getTemples({ page: 1, limit: 10 })).resolves.toEqual({
      items: temples,
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
  });

  it('searches temple translations and paginates results', async () => {
    prismaService.temple.findMany.mockResolvedValue([]);
    prismaService.temple.count.mockResolvedValue(12);

    await service.getTemples({ page: 2, limit: 5, search: 'guruvayur' });

    const expectedWhere = {
      translations: {
        some: {
          OR: [
            { name: { contains: 'guruvayur', mode: 'insensitive' } },
            { district: { contains: 'guruvayur', mode: 'insensitive' } },
            { place: { contains: 'guruvayur', mode: 'insensitive' } },
          ],
        },
      },
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
