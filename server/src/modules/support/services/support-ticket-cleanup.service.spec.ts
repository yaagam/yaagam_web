import { DELETE_RESOLVED_SUPPORT_TICKET_JOB } from '../constants/support-ticket-queue.const';
import { SupportTicketCleanupService } from './support-ticket-cleanup.service';

describe('SupportTicketCleanupService', () => {
  function createService() {
    const supportTicketQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    const supportTicketRepository = {
      deleteResolvedByIdBefore: jest.fn().mockResolvedValue(1),
    };

    return {
      service: new SupportTicketCleanupService(
        supportTicketQueue as never,
        supportTicketRepository as never,
      ),
      supportTicketQueue,
      supportTicketRepository,
    };
  }

  it('schedules resolved ticket deletion after seven days', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-07-04T00:00:00.000Z').getTime());
    const { service, supportTicketQueue } = createService();
    const resolvedAt = new Date('2026-07-04T00:00:00.000Z');

    await service.scheduleResolvedTicketDeletion('ticket-id', resolvedAt);

    expect(supportTicketQueue.add).toHaveBeenCalledWith(
      DELETE_RESOLVED_SUPPORT_TICKET_JOB,
      { ticketId: 'ticket-id' },
      expect.objectContaining({
        jobId: `${DELETE_RESOLVED_SUPPORT_TICKET_JOB}-ticket-id-${resolvedAt.getTime()}`,
        delay: 7 * 24 * 60 * 60 * 1000,
        attempts: 3,
      }),
    );
  });

  it('deletes a resolved ticket only through the repository guard', async () => {
    const { service, supportTicketRepository } = createService();
    const resolvedBefore = new Date('2026-07-11T00:00:00.000Z');

    await expect(
      service.deleteResolvedTicketIfExpired('ticket-id', resolvedBefore),
    ).resolves.toBe(1);
    expect(
      supportTicketRepository.deleteResolvedByIdBefore,
    ).toHaveBeenCalledWith('ticket-id', resolvedBefore);
  });
});
