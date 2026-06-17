import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import type {
  GetTemplesInput,
  ITempleService,
  PaginatedTemples,
} from './temple.service.interface';

@Injectable()
export class ServicesService implements ITempleService {
  constructor(private _prismaService: PrismaService) {}

  async getTemples({
    page,
    limit,
    search,
  }: GetTemplesInput): Promise<PaginatedTemples> {
    const normalizedSearch = search?.trim();
    const where: Prisma.TempleWhereInput | undefined = normalizedSearch
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: normalizedSearch, mode: 'insensitive' } },
                {
                  district: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
                { place: { contains: normalizedSearch, mode: 'insensitive' } },
              ],
            },
          },
        }
      : undefined;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this._prismaService.temple.findMany({
        where,
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.temple.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
