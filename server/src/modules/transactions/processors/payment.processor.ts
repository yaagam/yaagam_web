import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import {
  BACKFILL_SETTLEMENTS_JOB,
  PAYMENT_RECONCILIATION_SERVICE,
  RECONCILE_PAYMENTS_JOB,
  PROCESS_SETTLEMENT_JOB,
  SETTLEMENT_PROCESSING_SERVICE,
} from '../constants/payment.const';
import type { IPaymentReconciliationService } from '../services/payment-reconciliation.service';
import type { Job } from 'bullmq';
import {
  PAYMENT_QUEUE,
  PAYMENT_WEBHOOK_SERVICE,
  PROCESS_WEBHOOK_JOB,
} from '../constants/payment.const';
import type { IPaymentWebhookService } from '../interfaces/payment-webhook-service.interface';
import type { ISettlementProcessingService } from '../interfaces/settlement-processing-service.interface';
@Processor(PAYMENT_QUEUE)
export class PaymentProcessor extends WorkerHost {
  constructor(
    @Inject(PAYMENT_WEBHOOK_SERVICE)
    private readonly _webhooks: IPaymentWebhookService,
    @Inject(PAYMENT_RECONCILIATION_SERVICE)
    private readonly _reconciliation: IPaymentReconciliationService,
    @Inject(SETTLEMENT_PROCESSING_SERVICE)
    private readonly _settlements: ISettlementProcessingService,
  ) {
    super();
  }
  async process(
    job: Job<{
      eventId?: string;
      providerSettlementId?: string;
      days?: number;
    }>,
  ): Promise<void> {
    if (job.name === PROCESS_WEBHOOK_JOB)
      await this._webhooks.process(job.data.eventId!);
    else if (job.name === RECONCILE_PAYMENTS_JOB)
      await this._reconciliation.reconcileBatch();
    else if (job.name === PROCESS_SETTLEMENT_JOB)
      await this._settlements.process(job.data.providerSettlementId!);
    else if (job.name === BACKFILL_SETTLEMENTS_JOB)
      await this._settlements.backfill(job.data.days!);
  }
}
