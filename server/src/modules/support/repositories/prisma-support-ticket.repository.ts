import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SupportStatus } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import type { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import type { GetAdminSupportTicketsQueryDto } from '../dto/get-admin-support-tickets-query.dto';
import { SupportTicketMapper } from '../mappers/support-ticket.mapper';
import type {
  ISupportTicketRepository,
  PaginatedSupportTickets,
} from './support-ticket.repository.interface';

@Injectable()
export class PrismaSupportTicketRepository implements ISupportTicketRepository {
  private readonly _ticketNumberPrefix = 'SUP';
  private readonly _maxTicketNumberRetries = 3;

  constructor(private readonly _prismaService: PrismaService) {}

  async create(
    dto: CreateSupportTicketDto,
    userId?: string | null,
  ): Promise<ReturnType<typeof SupportTicketMapper.toEntity>> {
    for (let attempt = 1; attempt <= this._maxTicketNumberRetries; attempt++) {
      try {
        const ticket = await this._prismaService.$transaction(
          async (prisma) => {
            const ticketNumber = await this._createNextTicketNumber(prisma);

            return prisma.supportTicket.create({
              data: {
                ticketNumber,
                userId: userId ?? null,
                name: dto.name.trim(),
                phoneNumber: dto.phoneNumber.trim(),
                contactMethod: dto.contactMethod,
                problem: dto.problem.trim(),
                status: SupportStatus.OPEN,
              },
            });
          },
        );

        return SupportTicketMapper.toEntity(ticket);
      } catch (error) {
        if (
          attempt < this._maxTicketNumberRetries &&
          this._isUniqueConstraintError(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Unable to create support ticket number');
  }

  async findRecentUnresolvedByPhoneNumber(
    phoneNumber: string,
    createdAfter: Date,
  ): Promise<ReturnType<typeof SupportTicketMapper.toEntity> | null> {
    const ticket = await this._prismaService.supportTicket.findFirst({
      where: {
        phoneNumber: phoneNumber.trim(),
        status: { not: SupportStatus.RESOLVED },
        createdAt: { gte: createdAfter },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ticket ? SupportTicketMapper.toEntity(ticket) : null;
  }
  async findManyForAdmin(
    query: GetAdminSupportTicketsQueryDto,
  ): Promise<PaginatedSupportTickets> {
    const where = this._createAdminWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [tickets, total] = await Promise.all([
      this._prismaService.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this._prismaService.supportTicket.count({ where }),
    ]);

    return {
      items: tickets.map((ticket) => SupportTicketMapper.toEntity(ticket)),
      total,
    };
  }


  async findManyByUserId(
    userId: string,
    limit = 10,
  ): Promise<ReturnType<typeof SupportTicketMapper.toEntity>[]> {
    const tickets = await this._prismaService.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return tickets.map((ticket) => SupportTicketMapper.toEntity(ticket));
  }
  async updateStatus(
    id: string,
    status: SupportStatus,
    resolvedBy?: string | null,
  ): Promise<ReturnType<typeof SupportTicketMapper.toEntity>> {
    try {
      const ticket = await this._prismaService.supportTicket.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === SupportStatus.RESOLVED ? new Date() : null,
          resolvedBy: status === SupportStatus.RESOLVED ? resolvedBy : null,
        },
      });

      return SupportTicketMapper.toEntity(ticket);
    } catch (error) {
      if (this._isRecordNotFoundError(error)) {
        throw new NotFoundException('Support ticket not found');
      }

      throw error;
    }
  }

  async deleteResolvedByIdBefore(
    id: string,
    resolvedBefore: Date,
  ): Promise<number> {
    const result = await this._prismaService.supportTicket.deleteMany({
      where: {
        id,
        status: SupportStatus.RESOLVED,
        resolvedAt: { lte: resolvedBefore },
      },
    });

    return result.count;
  }
  private async _createNextTicketNumber(
    prisma: Prisma.TransactionClient,
  ): Promise<string> {
    const latestTicket = await prisma.supportTicket.findFirst({
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    const nextNumber = this._getTicketNumberSequence(
      latestTicket?.ticketNumber,
    );

    return `${this._ticketNumberPrefix}-${String(nextNumber).padStart(6, '0')}`;
  }

  private _getTicketNumberSequence(ticketNumber?: string): number {
    if (!ticketNumber) {
      return 1;
    }

    const sequence = Number(
      ticketNumber.replace(`${this._ticketNumberPrefix}-`, ''),
    );

    return Number.isNaN(sequence) ? 1 : sequence + 1;
  }

  private _createAdminWhere(
    query: GetAdminSupportTicketsQueryDto,
  ): Prisma.SupportTicketWhereInput | undefined {
    const filters: Prisma.SupportTicketWhereInput[] = [];
    const normalizedSearch = query.search?.trim();

    if (query.status) {
      filters.push({ status: query.status });
    }

    if (normalizedSearch) {
      filters.push({
        OR: [
          {
            ticketNumber: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            phoneNumber: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    return filters.length > 0 ? { AND: filters } : undefined;
  }

  private _isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private _isRecordNotFoundError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
