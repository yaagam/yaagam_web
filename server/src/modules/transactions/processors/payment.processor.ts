import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import {
  PAYMENT_RECONCILIATION_SERVICE,
  RECONCILE_PAYMENTS_JOB,
} from '../constants/payment.const';
import type { IPaymentReconciliationService } from '../services/payment-reconciliation.service';
import type { Job } from 'bullmq';
import {
  PAYMENT_QUEUE,
  PAYMENT_WEBHOOK_SERVICE,
  PROCESS_WEBHOOK_JOB,
} from '../constants/payment.const';
import type { IPaymentWebhookService } from '../interfaces/payment-webhook-service.interface';
@Processor(PAYMENT_QUEUE)
export class PaymentProcessor extends WorkerHost {
  constructor(
    @Inject(PAYMENT_WEBHOOK_SERVICE)
    private readonly _webhooks: IPaymentWebhookService,
    @Inject(PAYMENT_RECONCILIATION_SERVICE)
    private readonly _reconciliation: IPaymentReconciliationService,
  ) {
    super();
  }
  async process(job: Job<{ eventId: string }>): Promise<void> {
    if (job.name === PROCESS_WEBHOOK_JOB)
      await this._webhooks.process(job.data.eventId);
    else if (job.name === RECONCILE_PAYMENTS_JOB)
      await this._reconciliation.reconcileBatch();
  }
}
