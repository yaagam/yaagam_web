export const SUPPORT_TICKET_QUEUE = 'support-ticket';
export const DELETE_RESOLVED_SUPPORT_TICKET_JOB =
  'delete-resolved-support-ticket';

export interface DeleteResolvedSupportTicketJobData {
  ticketId: string;
}
