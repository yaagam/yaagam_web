import type { Prisma } from '@prisma/client';
import type { OfferingEntity } from '../entities/offering.entity';

export interface IOfferingRepository {
  findMany(
    where: Prisma.OfferingWhereInput,
    skip: number,
    take: number,
  ): Promise<OfferingEntity[]>;
  count(where: Prisma.OfferingWhereInput): Promise<number>;
  findById(id: string): Promise<OfferingEntity | null>;
  findBySlug(slug: string): Promise<OfferingEntity | null>;
  create(data: Prisma.OfferingCreateInput): Promise<OfferingEntity>;
  update(id: string, data: Prisma.OfferingUpdateInput): Promise<OfferingEntity>;
}
