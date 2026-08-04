import { Injectable } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import type {
  ITransactionQueryService,
  PaginatedTransactions,
  TransactionQuery,
} from '../interfaces/transaction-query-service.interface';

@Injectable()
export class TransactionQueryService implements ITransactionQueryService {
  constructor(private readonly _prismaService: PrismaService) {}

  async findTransactions(
    query: TransactionQuery,
  ): Promise<PaginatedTransactions> {
    const where = query.status ? { status: query.status } : undefined;
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this._prismaService.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this._prismaService.transaction.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
