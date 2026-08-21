import type { SettlementStatus, ZohoSyncStatus } from '@prisma/client';

export interface SettlementTrackerQuery {
  page: number;
  limit: number;
  status?: SettlementStatus;
  search?: string;
}

export interface SettlementTrackerItem {
  id: string;
  providerSettlementId: string;
  status: SettlementStatus;
  amount: number;
  fees: number;
  tax: number;
  currency: string;
  utr: string | null;
  providerCreatedAt: Date;
  settledAt: Date | null;
  lastErrorMessage: string | null;
  paymentCount: number;
  vendorBills: Array<{
    id: string;
    templeId: string;
    amount: number;
    status: ZohoSyncStatus;
    zohoBillId: string | null;
    errorMessage: string | null;
  }>;
}

export interface PaginatedSettlementTracker {
  items: SettlementTrackerItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ISettlementProcessingService {
  register(payload: Record<string, unknown>): Promise<void>;
  process(providerSettlementId: string): Promise<void>;
  findAll(query: SettlementTrackerQuery): Promise<PaginatedSettlementTracker>;
  retry(id: string): Promise<SettlementTrackerItem>;
  recover(providerSettlementId: string): Promise<SettlementTrackerItem>;
  requestBackfill(days: number): Promise<{ queued: true }>;
  backfill(days: number): Promise<void>;
}
