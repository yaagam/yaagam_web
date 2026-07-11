import type { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import type { SupportFaqEntity } from '../entities/support-faq.entity';
import type { SupportTicketEntity } from '../entities/support-ticket.entity';

export interface CreateSupportTicketResult {
  success: true;
  ticketNumber: string;
  message: 'Our support team will contact you within 24 hours.';
}

export interface SupportTicketAvailabilityResult {
  canCreate: boolean;
  message: string | null;
}

export interface ISupportService {
  getFaqs(): SupportFaqEntity[];
  checkTicketAvailability(
    phoneNumber: string,
  ): Promise<SupportTicketAvailabilityResult>;
  createTicket(
    dto: CreateSupportTicketDto,
    userId?: string | null,
  ): Promise<CreateSupportTicketResult>;
  getTicketHistory(userId: string): Promise<SupportTicketEntity[]>;
}
