import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import type { GetAdminBookingsQueryDto } from '../dtos/get-admin-bookings-query.dto';
import type { GetAdminUsersQueryDto } from '../dtos/get-admin-users-query.dto';
import type {
  AdminBookingItem,
  AdminPaginationMeta,
  AdminUserItem,
  IAdminService,
  PaginatedAdminBookings,
  PaginatedAdminUsers,
} from './admin.service.interface';

type SnapshotRecord = Record<string, unknown>;

type AdminUserWithCounts = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        bookings: true;
        addresses: true;
      };
    };
  };
}>;

type AdminBookingWithRelations = Prisma.BookingGetPayload<{
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
      };
    };
    temple: {
      include: {
        translations: true;
      };
    };
    transactions: {
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;

@Injectable()
export class AdminService implements IAdminService {
  private readonly _currency = 'INR';

  constructor(private readonly _prismaService: PrismaService) {}

  async getUsers(query: GetAdminUsersQueryDto): Promise<PaginatedAdminUsers> {
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
    query: GetAdminBookingsQueryDto,
  ): Promise<PaginatedAdminBookings> {
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
            },
          },
          temple: {
            include: {
              translations: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
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

  private _createUserWhere(
    query: GetAdminUsersQueryDto,
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

    if (query.role) {
      filters.push({ role: query.role });
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
    query: GetAdminBookingsQueryDto,
  ): Prisma.BookingWhereInput | undefined {
    const filters: Prisma.BookingWhereInput[] = [];
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

  private _createUserItem(user: AdminUserWithCounts): AdminUserItem {
    return {
      id: user.id,
      whatsappNumber: user.whatsappNumber,
      isWhatsappVerified: user.isWhatsappVerified,
      provider: user.provider,
      role: user.role,
      bookingsCount: user._count.bookings,
      addressesCount: user._count.addresses,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private _createBookingItem(
    booking: AdminBookingWithRelations,
  ): AdminBookingItem {
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
      amount: {
        base: Number(booking.baseAmount),
        discount: Number(booking.discountAmount),
        final: Number(booking.finalAmount),
        currency: this._currency,
      },
      latestPaymentStatus: booking.transactions[0]?.status ?? null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private _createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): AdminPaginationMeta {
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
      ? (value as SnapshotRecord)
      : {};
  }

  private _asRecordFromUnknown(value: unknown): SnapshotRecord | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SnapshotRecord)
      : null;
  }
}
