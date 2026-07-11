import type { SupportStatus } from '@prisma/client';
import type { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import type { GetAdminSupportTicketsQueryDto } from '../dto/get-admin-support-tickets-query.dto';
import type { SupportTicketEntity } from '../entities/support-ticket.entity';

export interface PaginatedSupportTickets {
  items: SupportTicketEntity[];
  total: number;
}

export interface ISupportTicketRepository {
  create(
    dto: CreateSupportTicketDto,
    userId?: string | null,
  ): Promise<SupportTicketEntity>;
  findRecentUnresolvedByPhoneNumber(
    phoneNumber: string,
    createdAfter: Date,
  ): Promise<SupportTicketEntity | null>;
  findManyForAdmin(
    query: GetAdminSupportTicketsQueryDto,
  ): Promise<PaginatedSupportTickets>;
  findManyByUserId(userId: string, limit?: number): Promise<SupportTicketEntity[]>;
  updateStatus(
    id: string,
    status: SupportStatus,
    resolvedBy?: string | null,
  ): Promise<SupportTicketEntity>;
  deleteResolvedByIdBefore(id: string, resolvedBefore: Date): Promise<number>;
}
