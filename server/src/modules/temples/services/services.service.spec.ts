import { Language } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import PrismaService from '../../../prisma/prisma.service';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const templeSelect = {
    id: true,
    slug: true,
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const fileStorageService = {
    uploadFile: jest.fn(),
    queueDeleteFile: jest.fn(),
  };
  const imageService = { getCardImage: jest.fn() };

  beforeEach(async () => {
    prismaService.temple.findMany.mockReset();
    prismaService.temple.count.mockReset();
    prismaService.temple.create.mockReset();
    prismaService.temple.findUnique.mockReset();
    prismaService.temple.update.mockReset();
    prismaService.temple.delete.mockReset();
    imageService.getCardImage.mockReset();
    fileStorageService.uploadFile.mockReset();
    fileStorageService.queueDeleteFile.mockReset();
    imageService.getCardImage.mockReturnValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: FILE_STORAGE_SERVICE, useValue: fileStorageService },
        { provide: IMAGE_SERVICE, useValue: imageService },
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
        slug: 'guruvayur',
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
    imageService.getCardImage.mockReturnValue(
      'https://cdn.example/card/temples/image.jpg',
    );

    await expect(service.getTemples({ page: 1, limit: 10 })).resolves.toEqual({
      items: [
        {
          id: 'temple-id',
          slug: 'guruvayur',
          state: 'Kerala',
          description: 'Historic temple',
          createdAt: temples[0].createdAt,
          updatedAt: temples[0].updatedAt,
          translations: [],
          imageUrl: 'https://cdn.example/card/temples/image.jpg',
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
    expect(imageService.getCardImage).toHaveBeenCalledWith('temples/image.jpg');
  });

  it('creates a temple from flat operations form fields', async () => {
    const createdAt = new Date();
    const updatedAt = new Date();
    const temple = {
      id: 'temple-id',
      slug: 'temple-name',
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
      slug: 'temple-name',
      email: 'temple@example.com',
      state: 'Kerala',
      description: 'Temple description',
      createdAt,
      updatedAt,
      translations: temple.translations,
      imageUrl: null,
    });
    expect(prismaService.temple.create).toHaveBeenCalledWith({
      data: {
        slug: 'temple-name',
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
      select: { ...templeSelect, email: true },
    });
  });

  it('returns email from ops detail while selecting relationship counts', async () => {
    const temple = {
      id: 'temple-id',
      slug: 'temple-name',
      email: 'temple@example.com',
      imageKey: null,
      state: 'Kerala',
      description: 'Temple description',
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [],
      _count: { poojas: 2, bookings: 3 },
    };
    prismaService.temple.findUnique.mockResolvedValue(temple);

    await expect(service.getTempleDetails('temple-id')).resolves.toEqual({
      id: 'temple-id',
      slug: 'temple-name',
      email: 'temple@example.com',
      state: 'Kerala',
      description: 'Temple description',
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt,
      translations: [],
      _count: { poojas: 2, bookings: 3 },
      imageUrl: null,
    });
    expect(prismaService.temple.findUnique).toHaveBeenCalledWith({
      where: { id: 'temple-id' },
      select: {
        ...templeSelect,
        email: true,
        _count: { select: { poojas: true, bookings: true } },
      },
    });
  });

  it('uploads and persists a replacement image during an ops update', async () => {
    const image = {
      buffer: Buffer.from('temple-image'),
      mimetype: 'image/jpeg',
      originalname: 'temple.jpg',
    };
    const updatedAt = new Date();
    const temple = {
      id: 'temple-id',
      slug: 'temple-name',
      email: 'temple@example.com',
      imageKey: 'temples/new-image.webp',
      state: 'Kerala',
      description: 'Updated temple',
      createdAt: new Date(),
      updatedAt,
      translations: [],
    };
    prismaService.temple.findUnique.mockResolvedValue({
      imageKey: 'temples/old-image.webp',
    });
    fileStorageService.uploadFile.mockResolvedValue('temples/new-image.webp');
    prismaService.temple.update.mockResolvedValue(temple);
    imageService.getCardImage.mockReturnValue(
      'https://cdn.example/temples/new-image.webp',
    );

    await expect(
      service.updateTemple(
        'temple-id',
        { description: 'Updated temple' },
        image,
      ),
    ).resolves.toEqual({
      id: 'temple-id',
      slug: 'temple-name',
      email: 'temple@example.com',
      state: 'Kerala',
      description: 'Updated temple',
      createdAt: temple.createdAt,
      updatedAt,
      translations: [],
      imageUrl: 'https://cdn.example/temples/new-image.webp',
    });
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
      image,
      'temples',
    );
    expect(prismaService.temple.update).toHaveBeenCalledWith({
      where: { id: 'temple-id' },
      data: {
        email: undefined,
        state: undefined,
        description: 'Updated temple',
        imageKey: 'temples/new-image.webp',
        translations: undefined,
      },
      select: { ...templeSelect, email: true },
    });
    expect(fileStorageService.queueDeleteFile).toHaveBeenCalledWith(
      'temples/old-image.webp',
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
