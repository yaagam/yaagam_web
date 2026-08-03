import type { PaymentStatus, Transaction } from '@prisma/client';

export interface TransactionQuery {
  page: number;
  limit: number;
  status?: PaymentStatus;
}

export interface PaginatedTransactions {
  items: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ITransactionQueryService {
  findTransactions(query: TransactionQuery): Promise<PaginatedTransactions>;
}
