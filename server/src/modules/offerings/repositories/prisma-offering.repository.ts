import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import type { OfferingEntity } from '../entities/offering.entity';
import type { IOfferingRepository } from './offering.repository.interface';

@Injectable()
export class PrismaOfferingRepository implements IOfferingRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  findMany(
    where: Prisma.OfferingWhereInput,
    skip: number,
    take: number,
  ): Promise<OfferingEntity[]> {
    return this._prismaService.offering.findMany({
      where,
      include: { translations: true, _count: { select: { poojas: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(where: Prisma.OfferingWhereInput): Promise<number> {
    return this._prismaService.offering.count({ where });
  }

  findById(id: string): Promise<OfferingEntity | null> {
    return this._prismaService.offering.findUnique({
      where: { id },
      include: { translations: true, _count: { select: { poojas: true } } },
    });
  }

  findBySlug(slug: string): Promise<OfferingEntity | null> {
    return this._prismaService.offering.findUnique({
      where: { slug },
      include: { translations: true, _count: { select: { poojas: true } } },
    });
  }

  create(data: Prisma.OfferingCreateInput): Promise<OfferingEntity> {
    return this._prismaService.offering.create({
      data,
      include: { translations: true, _count: { select: { poojas: true } } },
    });
  }

  update(
    id: string,
    data: Prisma.OfferingUpdateInput,
  ): Promise<OfferingEntity> {
    return this._prismaService.offering.update({
      where: { id },
      data,
      include: { translations: true, _count: { select: { poojas: true } } },
    });
  }
}
