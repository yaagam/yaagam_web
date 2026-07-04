import type { SupportTicket } from '@prisma/client';
import type { SupportTicketEntity } from '../entities/support-ticket.entity';

export class SupportTicketMapper {
  static toEntity(ticket: SupportTicket): SupportTicketEntity {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId,
      name: ticket.name,
      phoneNumber: ticket.phoneNumber,
      contactMethod: ticket.contactMethod,
      problem: ticket.problem,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      resolvedBy: ticket.resolvedBy,
    };
  }
}
