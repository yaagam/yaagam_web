import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { SUPPORT_TICKET_CLEANUP_SERVICE } from '../constants/service-tokens.const';
import {
  DELETE_RESOLVED_SUPPORT_TICKET_JOB,
  SUPPORT_TICKET_QUEUE,
  type DeleteResolvedSupportTicketJobData,
} from '../constants/support-ticket-queue.const';
import type { ISupportTicketCleanupService } from '../services/support-ticket-cleanup.service.interface';

const RESOLVED_TICKET_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

@Processor(SUPPORT_TICKET_QUEUE)
export class SupportTicketProcessor extends WorkerHost {
  constructor(
    @Inject(SUPPORT_TICKET_CLEANUP_SERVICE)
    private readonly _supportTicketCleanupService: ISupportTicketCleanupService,
  ) {
    super();
  }

  async process(job: Job<DeleteResolvedSupportTicketJobData>): Promise<void> {
    if (job.name !== DELETE_RESOLVED_SUPPORT_TICKET_JOB) {
      return;
    }

    await this._supportTicketCleanupService.deleteResolvedTicketIfExpired(
      job.data.ticketId,
      this._getResolvedBeforeDate(),
    );
  }

  private _getResolvedBeforeDate(): Date {
    return new Date(Date.now() - RESOLVED_TICKET_RETENTION_MS);
  }
}
