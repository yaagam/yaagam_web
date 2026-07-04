import type { ContactMethod, SupportStatus } from '@prisma/client';

export interface SupportTicketEntity {
  id: string;
  ticketNumber: string;
  userId: string | null;
  name: string;
  phoneNumber: string;
  contactMethod: ContactMethod;
  problem: string;
  status: SupportStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}
