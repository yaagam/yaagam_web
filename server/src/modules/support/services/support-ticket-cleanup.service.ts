import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { SUPPORT_TICKET_REPOSITORY } from '../constants/service-tokens.const';
import {
  DELETE_RESOLVED_SUPPORT_TICKET_JOB,
  SUPPORT_TICKET_QUEUE,
  type DeleteResolvedSupportTicketJobData,
} from '../constants/support-ticket-queue.const';
import type { ISupportTicketRepository } from '../repositories/support-ticket.repository.interface';
import type { ISupportTicketCleanupService } from './support-ticket-cleanup.service.interface';

const RESOLVED_TICKET_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SupportTicketCleanupService implements ISupportTicketCleanupService {
  constructor(
    @InjectQueue(SUPPORT_TICKET_QUEUE)
    private readonly _supportTicketQueue: Queue<DeleteResolvedSupportTicketJobData>,
    @Inject(SUPPORT_TICKET_REPOSITORY)
    private readonly _supportTicketRepository: ISupportTicketRepository,
  ) {}

  async scheduleResolvedTicketDeletion(
    ticketId: string,
    resolvedAt: Date,
  ): Promise<void> {
    const deleteAt = resolvedAt.getTime() + RESOLVED_TICKET_RETENTION_MS;
    const delay = Math.max(deleteAt - Date.now(), 0);

    await this._supportTicketQueue.add(
      DELETE_RESOLVED_SUPPORT_TICKET_JOB,
      { ticketId },
      {
        jobId: this._createDeleteResolvedTicketJobId(ticketId, resolvedAt),
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  deleteResolvedTicketIfExpired(
    ticketId: string,
    resolvedBefore: Date,
  ): Promise<number> {
    return this._supportTicketRepository.deleteResolvedByIdBefore(
      ticketId,
      resolvedBefore,
    );
  }

  private _createDeleteResolvedTicketJobId(
    ticketId: string,
    resolvedAt: Date,
  ): string {
    return `${DELETE_RESOLVED_SUPPORT_TICKET_JOB}-${ticketId}-${resolvedAt.getTime()}`;
  }
}
