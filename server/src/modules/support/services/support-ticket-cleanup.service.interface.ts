export interface ISupportTicketCleanupService {
  scheduleResolvedTicketDeletion(
    ticketId: string,
    resolvedAt: Date,
  ): Promise<void>;
  deleteResolvedTicketIfExpired(
    ticketId: string,
    resolvedBefore: Date,
  ): Promise<number>;
}
