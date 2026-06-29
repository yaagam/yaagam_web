import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  BookingType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { FILE_STORAGE_SERVICE } from '../../../common/storage/constants/storage-service-token.const';
import type { IFileStorageService } from '../../../common/storage/interfaces/file-storage.service.interface';
import PrismaService from '../../../prisma/prisma.service';
import { CreateCheckoutSessionDto } from '../dtos/create-checkout-session.dto';
import type { GetMyPoojasQueryDto } from '../dtos/get-my-poojas-query.dto';
import type {
  CheckoutSession,
  IBookingService,
  MyPoojaItem,
  PaginatedMyPoojas,
} from './booking.service.interface';
import { RazorpayClientService } from './razorpay-client.service';

type SnapshotRecord = Record<string, unknown>;

type BookingWithTransactions = Prisma.BookingGetPayload<{
  include: {
    transactions: {
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;

@Injectable()
export class BookingsService implements IBookingService {
  private readonly _currency = 'INR';

  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _razorpayClientService: RazorpayClientService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
  ) {}

  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    const pooja = await this._prismaService.pooja.findUnique({
      where: { id: dto.poojaId },
      include: {
        translations: true,
        temple: { include: { translations: true } },
      },
    });

    if (!pooja) {
      throw new NotFoundException('Pooja not found');
    }

    if (dto.plan === 'weekly' && !pooja.isWeekly) {
      throw new BadRequestException('Weekly booking is not available');
    }

    const bookingType =
      dto.plan === 'weekly' ? BookingType.WEEKLY : BookingType.SINGLE;
    const discountPercentage =
      dto.plan === 'weekly' ? pooja.weeklyDiscount : pooja.normalDiscount;
    const baseAmount = Number(pooja.baseAmount);
    const discountAmount = this._calculateDiscount(
      baseAmount,
      discountPercentage ?? 0,
    );
    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const amountInPaise = Math.round(finalAmount * 100);

    if (amountInPaise <= 0) {
      throw new BadRequestException('Booking amount must be greater than zero');
    }

    const bookingNumber = this._createBookingNumber();
    const created = await this._prismaService.$transaction(async (prisma) => {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber,
          userId,
          poojaId: pooja.id,
          templeId: pooja.templeId,
          devoteeSnapshot: this._toJson(dto.devotee),
          poojaSnapshot: this._toJson(pooja),
          templeSnapshot: this._toJson(pooja.temple),
          addressSnapshot: this._toJson(dto.address),
          bookingWhatsappNumber: dto.devotee.whatsappNumber,
          sankalpa: this._normalizeOptionalText(dto.sankalpa),
          type: bookingType,
          baseAmount,
          discountAmount,
          finalAmount,
          bookingDate: this._getNextBookingDate(pooja.poojaDay, pooja.time),
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
      const transaction = await prisma.transaction.create({
        data: {
          bookingId: booking.id,
          type: dto.plan === 'weekly' ? PaymentMethod.UPI : PaymentMethod.CARD,
          provider: PaymentProvider.RAZORPAY,
          amount: finalAmount,
          status: PaymentStatus.PENDING,
        },
      });

      return { booking, transaction };
    });

    const order = await this._razorpayClientService.createOrder({
      amount: amountInPaise,
      currency: this._currency,
      receipt: created.booking.bookingNumber,
      notes: {
        bookingId: created.booking.id,
        transactionId: created.transaction.id,
        plan: dto.plan,
      },
    });

    await this._prismaService.transaction.update({
      where: { id: created.transaction.id },
      data: { providerOrderId: order.id },
    });

    const isWeeklyPlan = dto.plan === 'weekly';

    return {
      bookingId: created.booking.id,
      transactionId: created.transaction.id,
      keyId: this._razorpayClientService.keyId,
      amount: order.amount,
      currency: order.currency,
      gatewayMode: isWeeklyPlan ? 'autopay-qr' : 'order',
      orderId: order.id,
      razorpayAutoPayQrId: isWeeklyPlan ? order.id : undefined,
      gatewayReference: order.id,
      prefill: {
        name: dto.devotee.name,
        contact: dto.devotee.whatsappNumber,
      },
    };
  }

  async getMyPoojas(
    userId: string,
    { page, limit, search, status }: GetMyPoojasQueryDto,
  ): Promise<PaginatedMyPoojas> {
    const normalizedSearch = search?.trim();
    const filters: Prisma.BookingWhereInput[] = [{ userId }];

    if (status) {
      filters.push({ status });
    }

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

    const where: Prisma.BookingWhereInput = { AND: filters };
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this._prismaService.booking.findMany({
        where,
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { bookingDate: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.booking.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = await Promise.all(
      bookings.map((booking) => this._createMyPoojaItem(booking)),
    );

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private _normalizeOptionalText(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }

  private _calculateDiscount(amount: number, percentage: number): number {
    return Math.round(((amount * percentage) / 100) * 100) / 100;
  }

  private _createBookingNumber(): string {
    return `YGM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private _getNextBookingDate(dayName: string, time?: string): Date {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const targetDay = days.indexOf(dayName.trim().toLowerCase());
    const bookingDate = new Date();

    if (targetDay === -1) {
      return bookingDate;
    }

    const daysUntil = (targetDay - bookingDate.getDay() + 7) % 7;
    bookingDate.setDate(bookingDate.getDate() + daysUntil);

    this._applyTimeToDate(bookingDate, time);
    return bookingDate;
  }

  private _applyTimeToDate(date: Date, time?: string): void {
    const normalizedTime = time?.trim();

    if (!normalizedTime) {
      return;
    }

    const match = normalizedTime.match(
      /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/i,
    );

    if (!match) {
      return;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3]?.toLowerCase();

    if (minutes > 59 || hours > (meridiem ? 12 : 23)) {
      return;
    }

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    }

    if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
  }

  private _toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async _createMyPoojaItem(
    booking: BookingWithTransactions,
  ): Promise<MyPoojaItem> {
    const poojaSnapshot = this._asRecord(booking.poojaSnapshot);
    const templeSnapshot = this._asRecord(booking.templeSnapshot);
    const imageKeys = this._getStringArray(poojaSnapshot.imageKeys);
    const imageUrls = await Promise.all(
      imageKeys.map((imageKey) =>
        this._fileStorageService.createSecureUrl(imageKey),
      ),
    );

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      pooja: {
        id: this._getStringValue(poojaSnapshot.id) ?? booking.poojaId ?? '',
        name: this._getTranslatedName(poojaSnapshot) ?? 'Pooja',
        imageUrls: imageUrls.filter((imageUrl): imageUrl is string =>
          Boolean(imageUrl),
        ),
      },
      temple: {
        id: booking.templeId,
        name: this._getTranslatedName(templeSnapshot) ?? 'Temple',
      },
      poojaDay: this._getStringValue(poojaSnapshot.poojaDay),
      poojaTime: this._getStringValue(poojaSnapshot.time),
      bookingDate: booking.bookingDate,
      type: booking.type,
      displayType:
        booking.type === BookingType.WEEKLY ? 'Weekly Plan' : 'Single Day',
      status: booking.status,
      displayStatus: this._getDisplayStatus(booking.status),
      amount: {
        base: Number(booking.baseAmount),
        discount: Number(booking.discountAmount),
        final: Number(booking.finalAmount),
        currency: this._currency,
      },
      whatsappNumber: booking.bookingWhatsappNumber,
      latestPaymentStatus: booking.transactions[0]?.status ?? null,
      completionNote:
        booking.status === BookingStatus.COMPLETED
          ? `Pooja completed. Photos & videos sent on WhatsApp +91 ${booking.bookingWhatsappNumber}`
          : null,
      createdAt: booking.createdAt,
    };
  }

  private _asRecord(value: Prisma.JsonValue): SnapshotRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SnapshotRecord)
      : {};
  }

  private _getTranslatedName(snapshot: SnapshotRecord): string | null {
    const translations = Array.isArray(snapshot.translations)
      ? snapshot.translations
      : [];
    const englishTranslation = translations.find(
      (translation): translation is SnapshotRecord =>
        this._asRecordFromUnknown(translation)?.language === 'EN',
    );
    const selectedTranslation =
      this._asRecordFromUnknown(englishTranslation) ||
      this._asRecordFromUnknown(translations[0]);

    return this._getStringValue(selectedTranslation?.name);
  }

  private _asRecordFromUnknown(value: unknown): SnapshotRecord | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as SnapshotRecord)
      : null;
  }

  private _getStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private _getStringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private _getDisplayStatus(
    status: BookingStatus,
  ): MyPoojaItem['displayStatus'] {
    switch (status) {
      case BookingStatus.PENDING_PAYMENT:
      case BookingStatus.PAYMENT_FAILED:
        return 'Booked';
      case BookingStatus.SCHEDULED:
        return 'Scheduled';
      case BookingStatus.COMPLETED:
        return 'Completed';
      case BookingStatus.CONFIRMED:
      case BookingStatus.CANCELLED:
      case BookingStatus.REFUNDED:
        return 'Processing';
    }
  }
}
