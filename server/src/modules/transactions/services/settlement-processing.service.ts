import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma, SettlementStatus, ZohoSyncStatus } from '@prisma/client';
import type { Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import { ZOHO_BOOKS_SERVICE } from '../../../integrations/zoho/constants/zoho-service-token.const';
import type { IZohoBooksService } from '../../../integrations/zoho/services/zoho-books.service.interface';
import {
  PAYMENT_PROVIDER,
  PAYMENT_QUEUE,
  PROCESS_SETTLEMENT_JOB,
} from '../constants/payment.const';
import type {
  IPaymentProvider,
  ProviderSettlementReconciliationItem,
} from '../interfaces/payment-provider.interface';
import type { ISettlementProcessingService } from '../interfaces/settlement-processing-service.interface';

type JsonRecord = Record<string, unknown>;

@Injectable()
export class SettlementProcessingService implements ISettlementProcessingService {
  constructor(
    private readonly _prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly _provider: IPaymentProvider,
    @Inject(ZOHO_BOOKS_SERVICE) private readonly _zoho: IZohoBooksService,
    @InjectQueue(PAYMENT_QUEUE) private readonly _queue: Queue,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(SettlementProcessingService.name);
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
    const jobId = `settlement-${providerSettlementId}`;
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
