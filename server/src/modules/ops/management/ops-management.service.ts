import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  SupportStatus,
} from '@prisma/client';
import {
  SUPPORT_TICKET_CLEANUP_SERVICE,
  SUPPORT_TICKET_REPOSITORY,
} from '../../support/constants/service-tokens.const';
import type { GetOpsSupportTicketsQueryDto } from '../../support/dto/get-ops-support-tickets-query.dto';
import type { UpdateSupportTicketStatusDto } from '../../support/dto/update-support-ticket-status.dto';
import type { ISupportTicketRepository } from '../../support/repositories/support-ticket.repository.interface';
import type { ISupportTicketCleanupService } from '../../support/services/support-ticket-cleanup.service.interface';
import PrismaService from '../../../prisma/prisma.service';
import type { GetOpsBookingsQueryDto } from '../bookings/get-ops-bookings-query.dto';
import { BOOKING_PAYMENT_ACTIVATION_SERVICE } from '../../bookings/constants/service-tokens.const';
import type { IBookingPaymentActivationService } from '../../bookings/services/booking-payment-activation.service.interface';
import type { GetOpsUsersQueryDto } from '../users/get-ops-users-query.dto';
import type {
  OpsBookingItem,
  OpsPaginationMeta,
  OpsUserItem,
  IOpsManagementService,
  PaginatedOpsBookings,
  PaginatedOpsSupportTickets,
  PaginatedOpsUsers,
  UpdatedOpsSupportTicketStatus,
} from './ops-management.service.interface';

type SnapshotRecord = Record<string, unknown>;

type OpsUserWithCounts = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        bookings: true;
        addresses: true;
      };
    };
  };
}>;

type OpsBookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        whatsappNumber: true;
        isWhatsappVerified: true;
      };
    };
    pooja: {
      include: {
        translations: true;
        benefits: { include: { translations: true } };
      };
    };
    temple: {
      select: {
        translations: true;
      };
    };
    transactions: {
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
    occurrences: {
      orderBy: { sequence: 'desc' };
      take: 1;
    };
  };
}>;

@Injectable()
export class OpsManagementService implements IOpsManagementService {
  private readonly _currency = 'INR';

  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(SUPPORT_TICKET_REPOSITORY)
    private readonly _supportTicketRepository: ISupportTicketRepository,
    @Inject(SUPPORT_TICKET_CLEANUP_SERVICE)
    private readonly _supportTicketCleanupService: ISupportTicketCleanupService,
    @Inject(BOOKING_PAYMENT_ACTIVATION_SERVICE)
    private readonly _bookingPaymentActivationService: IBookingPaymentActivationService,
  ) {}

  async getUsers(query: GetOpsUsersQueryDto): Promise<PaginatedOpsUsers> {
    const { page, limit } = query;
    const where = this._createUserWhere(query);
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this._prismaService.user.findMany({
        where,
        include: {
          _count: {
            select: {
              bookings: true,
              addresses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.user.count({ where }),
    ]);

    return {
      items: users.map((user) => this._createUserItem(user)),
      meta: this._createPaginationMeta(page, limit, total),
    };
  }

  async getBookings(
    query: GetOpsBookingsQueryDto,
  ): Promise<PaginatedOpsBookings> {
    const { page, limit } = query;
    const where = this._createBookingWhere(query);
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this._prismaService.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              whatsappNumber: true,
              isWhatsappVerified: true,
            },
          },
          pooja: {
            include: {
              translations: true,
              benefits: { include: { translations: true } },
            },
          },
          temple: {
            select: {
              translations: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          occurrences: { orderBy: { sequence: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.booking.count({ where }),
    ]);

    return {
      items: bookings.map((booking) => this._createBookingItem(booking)),
      meta: this._createPaginationMeta(page, limit, total),
    };
  }

  async getBooking(id: string): Promise<OpsBookingItem> {
    const booking = await this._prismaService.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            whatsappNumber: true,
            isWhatsappVerified: true,
          },
        },
        pooja: {
          include: {
            translations: true,
            benefits: { include: { translations: true } },
          },
        },
        temple: {
          select: {
            translations: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        occurrences: { orderBy: { sequence: 'desc' }, take: 1 },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this._createBookingItem(booking);
  }

  async retryBookingZohoSync(id: string): Promise<OpsBookingItem> {
    const booking = await this._prismaService.booking.findUnique({
      where: { id },
      select: {
        occurrences: { orderBy: { sequence: 'desc' }, take: 1 },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            paymentAttempts: {
              where: { status: PaymentStatus.SUCCESS },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const transaction = booking.transactions[0];
    const attempt = transaction?.paymentAttempts[0];
    const occurrence = booking.occurrences?.[0];
    const paymentAttemptId = occurrence?.paymentAttemptId ?? attempt?.id;
    if (!transaction || !paymentAttemptId) {
      throw new BadRequestException(
        'A successful payment is required before retrying Zoho sync',
      );
    }
    await this._bookingPaymentActivationService.activatePaidOccurrence({
      transactionId: transaction.id,
      paymentAttemptId,
    });
    return this.getBooking(id);
  }

  updateBookingStatus(
    id: string,
    status: BookingStatus,
  ): Promise<{ id: string; status: BookingStatus; updatedAt: Date }> {
    return this._prismaService.booking.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });
  }
  async getSupportTickets(
    query: GetOpsSupportTicketsQueryDto,
  ): Promise<PaginatedOpsSupportTickets> {
    const { items, total } =
      await this._supportTicketRepository.findManyForOps(query);

    return {
      items,
      meta: this._createPaginationMeta(query.page, query.limit, total),
    };
  }

  async updateSupportTicketStatus(
    id: string,
    dto: UpdateSupportTicketStatusDto,
    resolvedBy?: string | null,
  ): Promise<UpdatedOpsSupportTicketStatus> {
    const ticket = await this._supportTicketRepository.updateStatus(
      id,
      dto.status,
      resolvedBy,
    );

    if (ticket.status === SupportStatus.RESOLVED && ticket.resolvedAt) {
      await this._supportTicketCleanupService.scheduleResolvedTicketDeletion(
        ticket.id,
        ticket.resolvedAt,
      );
    }

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      resolvedAt: ticket.resolvedAt,
      resolvedBy: ticket.resolvedBy,
    };
  }

  private _createUserWhere(
    query: GetOpsUsersQueryDto,
  ): Prisma.UserWhereInput | undefined {
    const filters: Prisma.UserWhereInput[] = [];
    const normalizedSearch = query.search?.trim();

    if (normalizedSearch) {
      filters.push({
        OR: [
          { id: { contains: normalizedSearch, mode: 'insensitive' } },
          {
            whatsappNumber: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (query.provider) {
      filters.push({ provider: query.provider });
    }

    if (typeof query.isWhatsappVerified === 'boolean') {
      filters.push({ isWhatsappVerified: query.isWhatsappVerified });
    }

    return filters.length > 0 ? { AND: filters } : undefined;
  }

  private _createBookingWhere(
    query: GetOpsBookingsQueryDto,
  ): Prisma.BookingWhereInput | undefined {
    const filters: Prisma.BookingWhereInput[] = [
      { activatedAt: { not: null } },
    ];
    const normalizedSearch = query.search?.trim();

    if (normalizedSearch) {
      filters.push({
        OR: [
          {
            bookingNumber: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            bookingWhatsappNumber: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            user: {
              whatsappNumber: {
                contains: normalizedSearch,
                mode: 'insensitive',
              },
            },
          },
          {
            pooja: {
              translations: {
                some: {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
          {
            temple: {
              translations: {
                some: {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.type) {
      filters.push({ type: query.type });
    }

    if (query.paymentStatus) {
      filters.push({
        transactions: {
          some: {
            status: query.paymentStatus,
          },
        },
      });
    }

    if (query.userId?.trim()) {
      filters.push({ userId: query.userId.trim() });
    }

    if (query.poojaId?.trim()) {
      filters.push({ poojaId: query.poojaId.trim() });
    }

    if (query.templeId?.trim()) {
      filters.push({ templeId: query.templeId.trim() });
    }

    if (query.templeName?.trim()) {
      filters.push({
        temple: {
          translations: {
            some: {
              name: {
                contains: query.templeName.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
      });
    }

    if (query.bookingDateFrom || query.bookingDateTo) {
      filters.push({
        bookingDate: {
          gte: query.bookingDateFrom,
          lte: query.bookingDateTo,
        },
      });
    }

    return filters.length > 0 ? { AND: filters } : undefined;
  }

  private _createUserItem(user: OpsUserWithCounts): OpsUserItem {
    return {
      id: user.id,
      whatsappNumber: user.whatsappNumber,
      isWhatsappVerified: user.isWhatsappVerified,
      provider: user.provider,
      bookingsCount: user._count.bookings,
      addressesCount: user._count.addresses,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private _createBookingItem(booking: OpsBookingWithRelations): OpsBookingItem {
    const occurrence = booking.occurrences?.[0];
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      user: booking.user,
      pooja: {
        id:
          this._getSnapshotString(booking.poojaSnapshot, 'id') ??
          booking.poojaId ??
          '',
        name:
          this._getTranslatedName(booking.pooja?.translations ?? []) ??
          this._getSnapshotName(booking.poojaSnapshot) ??
          'Pooja',
      },
      benefits: (booking.pooja?.benefits ?? []).map((benefit) => ({
        id: benefit.id,
        name: this._getTranslatedName(benefit.translations) ?? 'Benefit',
      })),
      temple: {
        id: booking.templeId,
        name:
          this._getTranslatedName(booking.temple.translations) ??
          this._getSnapshotName(booking.templeSnapshot) ??
          'Temple',
      },
      bookingWhatsappNumber: booking.bookingWhatsappNumber,
      type: booking.type,
      status: booking.status,
      bookingDate: booking.bookingDate,
      poojaDate: booking.poojaDate,
      amount: {
        base: Number(booking.baseAmount),
        discount: Number(booking.discountAmount),
        final: Number(booking.finalAmount),
        currency: this._currency,
      },
      latestPaymentStatus: booking.transactions[0]?.status ?? null,
      zohoSyncStatus: occurrence?.zohoSyncStatus ?? booking.zohoSyncStatus,
      zohoSyncError: occurrence?.zohoSyncError ?? booking.zohoSyncError,
      zohoSalesOrderId:
        occurrence?.zohoSalesOrderId ?? booking.zohoSalesOrderId,
      zohoInvoiceId: occurrence?.zohoInvoiceId ?? null,
      zohoPaymentId: occurrence?.zohoPaymentId ?? null,
      zohoBillId: occurrence?.zohoBillId ?? null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private _createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): OpsPaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private _getTranslatedName(
    translations: { language: string; name: string }[],
  ): string | null {
    return (
      translations.find((translation) => translation.language === 'EN')?.name ??
      translations[0]?.name ??
      null
    );
  }

  private _getSnapshotString(
    snapshot: Prisma.JsonValue,
    key: string,
  ): string | null {
    const value = this._asRecord(snapshot)[key];

    return typeof value === 'string' && value.trim() ? value : null;
  }

  private _getSnapshotName(snapshot: Prisma.JsonValue): string | null {
    const record = this._asRecord(snapshot);
    const translations = Array.isArray(record.translations)
      ? record.translations
      : [];
    const englishTranslation = translations.find(
      (translation): translation is SnapshotRecord =>
        this._asRecordFromUnknown(translation)?.language === 'EN',
    );
    const selectedTranslation =
      this._asRecordFromUnknown(englishTranslation) ||
      this._asRecordFromUnknown(translations[0]);
    const name = selectedTranslation?.name;

    return typeof name === 'string' && name.trim() ? name : null;
  }

  private _asRecord(value: Prisma.JsonValue): SnapshotRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  }

  private _asRecordFromUnknown(value: unknown): SnapshotRecord | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SnapshotRecord)
      : null;
  }
}
