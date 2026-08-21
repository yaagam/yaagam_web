import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma, SettlementStatus, ZohoSyncStatus } from '@prisma/client';
import type { Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import { ZOHO_BOOKS_SERVICE } from '../../../integrations/zoho/constants/zoho-service-token.const';
import type { IZohoBooksService } from '../../../integrations/zoho/services/zoho-books.service.interface';
import {
  BACKFILL_SETTLEMENTS_JOB,
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  PROCESS_SETTLEMENT_JOB,
} from '../constants/payment.const';
import type {
  IPaymentProvider,
  ProviderSettlement,
  ProviderSettlementReconciliationItem,
} from '../interfaces/payment-provider.interface';
import type {
  ISettlementProcessingService,
  PaginatedSettlementTracker,
  SettlementTrackerItem,
  SettlementTrackerQuery,
} from '../interfaces/settlement-processing-service.interface';

type JsonRecord = Record<string, unknown>;
type SettlementTrackerRow = Prisma.RazorpaySettlementGetPayload<{
  include: {
    _count: { select: { payments: true } };
    vendorBills: true;
  };
}>;

@Injectable()
export class SettlementProcessingService
  implements ISettlementProcessingService, OnModuleInit
{
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @Inject(ZOHO_BOOKS_SERVICE) private readonly _zoho: IZohoBooksService,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(SettlementProcessingService.name);
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this._queue.add(
        BACKFILL_SETTLEMENTS_JOB,
        { days: 3 },
        {
          jobId: 'settlement-backfill-hourly',
          repeat: { every: 60 * 60 * 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
      this._queue.add(
        BACKFILL_SETTLEMENTS_JOB,
        { days: 7 },
        {
          jobId: 'settlement-backfill-daily',
          repeat: { every: 24 * 60 * 60 * 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
    ]);
  }

  async register(payload: JsonRecord): Promise<void> {
    const entity = this._record(this._record(payload.settlement).entity);
    const providerSettlementId = this._string(entity.id);
    const amount = this._integer(entity.amount);
    const createdAt = this._integer(entity.created_at);
    if (!providerSettlementId || amount === null || createdAt === null) {
      throw new Error('Invalid Razorpay settlement entity');
    }
    await this._prisma.razorpaySettlement.upsert({
      where: { providerSettlementId },
      create: {
        providerSettlementId,
        amountMinor: BigInt(amount),
        feeMinor: BigInt(this._integer(entity.fees) ?? 0),
        taxMinor: BigInt(this._integer(entity.tax) ?? 0),
        utr: this._string(entity.utr),
        providerCreatedAt: new Date(createdAt * 1000),
        providerPayload: entity as Prisma.InputJsonValue,
      },
      update: {
        amountMinor: BigInt(amount),
        feeMinor: BigInt(this._integer(entity.fees) ?? 0),
        taxMinor: BigInt(this._integer(entity.tax) ?? 0),
        utr: this._string(entity.utr),
        providerPayload: entity as Prisma.InputJsonValue,
      },
    });
    await this._enqueue(providerSettlementId);
  }

  async findAll(
    query: SettlementTrackerQuery,
  ): Promise<PaginatedSettlementTracker> {
    const search = query.search?.trim();
    const where: Prisma.RazorpaySettlementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              {
                providerSettlementId: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                utr: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await this._prisma.$transaction([
      this._prisma.razorpaySettlement.findMany({
        where,
        orderBy: { providerCreatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { payments: true } },
          vendorBills: { orderBy: { createdAt: 'asc' } },
        },
      }),
      this._prisma.razorpaySettlement.count({ where }),
    ]);
    return {
      items: rows.map((row) => this._toTrackerItem(row)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async retry(id: string): Promise<SettlementTrackerItem> {
    const settlement = await this._prisma.razorpaySettlement.findUnique({
      where: { id },
      include: {
        _count: { select: { payments: true } },
        vendorBills: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status === SettlementStatus.PROCESSING) {
      throw new ConflictException(
        'Settlement reconciliation is already running',
      );
    }
    if (settlement.status === SettlementStatus.SETTLED) {
      throw new ConflictException('Settlement is already reconciled');
    }
    const updated = await this._prisma.razorpaySettlement.update({
      where: { id },
      data: {
        status: SettlementStatus.PENDING,
        lastErrorMessage: null,
        vendorBills: {
          updateMany: {
            where: { status: ZohoSyncStatus.FAILED },
            data: { status: ZohoSyncStatus.PENDING, errorMessage: null },
          },
        },
      },
      include: {
        _count: { select: { payments: true } },
        vendorBills: { orderBy: { createdAt: 'asc' } },
      },
    });
    await this._enqueue(updated.providerSettlementId);
    return this._toTrackerItem(updated);
  }

  async recover(providerSettlementId: string): Promise<SettlementTrackerItem> {
    const normalizedId = providerSettlementId.trim();
    if (!/^setl_[A-Za-z0-9]+$/.test(normalizedId)) {
      throw new BadRequestException('Invalid Razorpay settlement ID');
    }
    const settlement = await this._provider.fetchSettlement(normalizedId);
    if (settlement.status !== 'processed') {
      throw new ConflictException(
        `Settlement is not processed (status: ${settlement.status})`,
      );
    }
    await this._registerProviderSettlement(settlement);
    return this._findTrackerByProviderId(normalizedId);
  }

  async requestBackfill(days: number): Promise<{ queued: true }> {
    await this._queue.add(
      BACKFILL_SETTLEMENTS_JOB,
      { days },
      {
        jobId: `settlement-backfill-manual-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    return { queued: true };
  }

  async backfill(days: number): Promise<void> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;
    for (let skip = 0; ; skip += 100) {
      const page = await this._provider.fetchSettlements({
        from,
        to,
        skip,
        count: 100,
      });
      for (const settlement of page.items) {
        if (settlement.status === 'processed') {
          await this._registerProviderSettlement(settlement);
        }
      }
      if (!page.hasMore) break;
    }
  }

  private async _enqueue(providerSettlementId: string): Promise<void> {
    const jobId = 'settlement-' + providerSettlementId;
    const existing = await this._queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === 'failed' || state === 'completed') await existing.remove();
      else return;
    }
    await this._queue.add(
      PROCESS_SETTLEMENT_JOB,
      { providerSettlementId },
      {
        jobId,
        attempts: 8,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  private async _registerProviderSettlement(
    settlement: ProviderSettlement,
  ): Promise<void> {
    await this.register({
      settlement: {
        entity: {
          id: settlement.id,
          amount: settlement.amount,
          fees: settlement.fees,
          tax: settlement.tax,
          utr: settlement.utr,
          created_at: settlement.createdAt,
        },
      },
    });
  }

  private async _findTrackerByProviderId(
    providerSettlementId: string,
  ): Promise<SettlementTrackerItem> {
    const row = await this._prisma.razorpaySettlement.findUniqueOrThrow({
      where: { providerSettlementId },
      include: {
        _count: { select: { payments: true } },
        vendorBills: { orderBy: { createdAt: 'asc' } },
      },
    });
    return this._toTrackerItem(row);
  }

  async process(providerSettlementId: string): Promise<void> {
    const settlement = await this._prisma.razorpaySettlement.findUniqueOrThrow({
      where: { providerSettlementId },
    });
    if (settlement.status === SettlementStatus.SETTLED) return;
    await this._prisma.razorpaySettlement.update({
      where: { id: settlement.id },
      data: { status: SettlementStatus.PROCESSING, lastErrorMessage: null },
    });
    try {
      const recon = await this._fetchReconciliation(
        settlement.providerCreatedAt,
        providerSettlementId,
      );
      const paymentRows = recon.filter((item) => item.type === 'payment');
      const paymentIds = paymentRows.map((item) => item.entityId);
      const attempts = await this._prisma.paymentAttempt.findMany({
        where: { providerPaymentId: { in: paymentIds } },
        include: {
          transaction: { include: { booking: { include: { temple: true } } } },
          bookingOccurrence: {
            include: { booking: { include: { temple: true } } },
          },
        },
      });
      const attemptsByPaymentId = new Map(
        attempts.map((attempt) => [attempt.providerPaymentId!, attempt]),
      );
      const missing = paymentIds.filter((id) => !attemptsByPaymentId.has(id));
      for (const row of paymentRows) {
        const attempt = attemptsByPaymentId.get(row.entityId);
        if (!attempt) continue;
        const booking =
          attempt.bookingOccurrence?.booking ?? attempt.transaction.booking;
        await this._prisma.settlementPayment.upsert({
          where: { paymentAttemptId: attempt.id },
          create: {
            settlementId: settlement.id,
            paymentAttemptId: attempt.id,
            bookingId: booking.id,
            templeId: booking.templeId,
            templePayableAmount: booking.templePayableAmount,
            razorpayFeeMinor: BigInt(row.fee),
            razorpayTaxMinor: BigInt(row.tax),
          },
          update: {
            razorpayFeeMinor: BigInt(row.fee),
            razorpayTaxMinor: BigInt(row.tax),
          },
        });
      }
      const totalFeeMinor = paymentRows.reduce((sum, row) => sum + row.fee, 0);
      const totalTaxMinor = paymentRows.reduce((sum, row) => sum + row.tax, 0);
      if (totalFeeMinor > 0) {
        await this._zoho.createRazorpayChargesExpense({
          settlementId: settlement.id,
          referenceNumber: `RZP-${providerSettlementId}`,
          date: this._formatIndiaDate(settlement.providerCreatedAt),
          amount: totalFeeMinor / 100,
          taxAmount: totalTaxMinor / 100,
        });
      }

      const grouped = new Map<string, { vendorId: string; amount: number }>();
      for (const attempt of attempts) {
        const booking =
          attempt.bookingOccurrence?.booking ?? attempt.transaction.booking;
        if (!booking.temple.zohoVendorId)
          throw new Error(`Temple ${booking.templeId} is not synced to Zoho`);
        const current = grouped.get(booking.templeId) ?? {
          vendorId: booking.temple.zohoVendorId,
          amount: 0,
        };
        current.amount = this._roundMoney(
          current.amount + Number(booking.templePayableAmount),
        );
        grouped.set(booking.templeId, current);
      }
      for (const [templeId, group] of grouped) {
        const bill = await this._prisma.settlementVendorBill.upsert({
          where: {
            settlementId_templeId: { settlementId: settlement.id, templeId },
          },
          create: {
            settlementId: settlement.id,
            templeId,
            vendorId: group.vendorId,
            amount: group.amount,
          },
          update: { amount: group.amount, vendorId: group.vendorId },
        });
        if (bill.zohoBillId) continue;
        const result = await this._zoho.createVendorBill({
          bookingId: settlement.id,
          vendorId: group.vendorId,
          referenceNumber: `${providerSettlementId}-${templeId.slice(0, 8)}`,
          date: this._formatIndiaDate(settlement.providerCreatedAt),
          lineItems: [
            {
              name: `Temple payable - ${providerSettlementId}`,
              rate: group.amount,
              quantity: 1,
            },
          ],
        });
        await this._prisma.settlementVendorBill.update({
          where: { id: bill.id },
          data: {
            zohoBillId: result.billId,
            status: ZohoSyncStatus.SYNCED,
            errorMessage: null,
          },
        });
      }
      await this._prisma.razorpaySettlement.update({
        where: { id: settlement.id },
        data: {
          status: missing.length
            ? SettlementStatus.PARTIAL
            : SettlementStatus.SETTLED,
          settledAt: new Date(),
          lastErrorMessage: missing.length
            ? `Unmapped Razorpay payments: ${missing.join(', ')}`.slice(0, 1000)
            : null,
        },
      });
      if (missing.length)
        throw new Error(`Settlement has ${missing.length} unmapped payment(s)`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown settlement processing error';
      await this._prisma.razorpaySettlement.updateMany({
        where: { id: settlement.id, status: SettlementStatus.PROCESSING },
        data: { status: SettlementStatus.FAILED, lastErrorMessage: message },
      });
      this._logger.error(
        { providerSettlementId, error: message },
        'Razorpay settlement processing failed',
      );
      throw error;
    }
  }

  private async _fetchReconciliation(
    date: Date,
    settlementId: string,
  ): Promise<ProviderSettlementReconciliationItem[]> {
    const india = new Date(
      date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    );
    const result: ProviderSettlementReconciliationItem[] = [];
    for (let skip = 0; ; skip += 1000) {
      const page = await this._provider.fetchSettlementReconciliation({
        year: india.getFullYear(),
        month: india.getMonth() + 1,
        day: india.getDate(),
        skip,
        count: 1000,
      });
      result.push(
        ...page.items.filter((item) => item.settlementId === settlementId),
      );
      if (!page.hasMore) break;
    }
    return result;
  }

  private _record(value: unknown): JsonRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as JsonRecord)
      : {};
  }
  private _toTrackerItem(row: SettlementTrackerRow): SettlementTrackerItem {
    return {
      id: row.id,
      providerSettlementId: row.providerSettlementId,
      status: row.status,
      amount: Number(row.amountMinor) / 100,
      fees: Number(row.feeMinor) / 100,
      tax: Number(row.taxMinor) / 100,
      currency: row.currency,
      utr: row.utr,
      providerCreatedAt: row.providerCreatedAt,
      settledAt: row.settledAt,
      lastErrorMessage: row.lastErrorMessage,
      paymentCount: row._count.payments,
      vendorBills: row.vendorBills.map((bill) => ({
        id: bill.id,
        templeId: bill.templeId,
        amount: Number(bill.amount),
        status: bill.status,
        zohoBillId: bill.zohoBillId,
        errorMessage: bill.errorMessage,
      })),
    };
  }
  private _string(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  private _integer(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value)
      ? value
      : null;
  }
  private _formatIndiaDate(value: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }
  private _roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
