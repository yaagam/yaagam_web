import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  BookingType,
  PaymentMethod,
  PaymentOrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import type { IImageService } from '../../../common/image/interfaces/image-service.interface';
import PrismaService from '../../../prisma/prisma.service';
import {
  CheckoutAddressDto,
  CreateCheckoutSessionDto,
} from '../dtos/create-checkout-session.dto';
import type { GetMyPoojasQueryDto } from '../dtos/get-my-poojas-query.dto';
import type {
  CheckoutSession,
  IBookingService,
  LastBookingDevoteeDetails,
  MyPoojaItem,
  PaginatedMyPoojas,
} from './booking.service.interface';
import { RAZORPAY_CLIENT } from '../../../integrations/razorpay/constants/razorpay-service-token.const';
import type { IRazorpayClient } from '../../../integrations/razorpay/interfaces/razorpay-client.interface';
import { BOOKING_LIFECYCLE_SERVICE } from '../constants/service-tokens.const';
import type { IBookingLifecycleService } from './booking-lifecycle.service.interface';
import {
  BOOKING_CONSENT_NOTICE_VERSION,
  BOOKING_CONSENT_PURPOSE,
} from '../../privacy/privacy.constants';

type SnapshotRecord = Record<string, unknown>;

interface DevoteeSnapshot {
  devotees: Array<{ name: string; naal: string }>;
  whatsappNumber: string;
  state: string;
  specialRequest?: string;
}

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
  private readonly _paymentTtlMs = 15 * 60 * 1000;
  private readonly _weeklySubscriptionCycles = 51;
  private readonly _indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  private readonly _upiAutoPayLimitPaise = 1_500_000;

  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(RAZORPAY_CLIENT)
    private readonly _razorpayClientService: IRazorpayClient,
    @Inject(IMAGE_SERVICE)
    private readonly _imageService: IImageService,
    private readonly _configService?: ConfigService,
    @Optional()
    @Inject(BOOKING_LIFECYCLE_SERVICE)
    private readonly _bookingLifecycleService?: IBookingLifecycleService,
  ) {}

  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    const bookingConsent = await this._prismaService.privacyConsent.findUnique({
      where: {
        userId_purpose_noticeVersion: {
          userId,
          purpose: BOOKING_CONSENT_PURPOSE,
          noticeVersion: BOOKING_CONSENT_NOTICE_VERSION,
        },
      },
      select: { withdrawnAt: true },
    });

    if (!bookingConsent || bookingConsent.withdrawnAt) {
      throw new BadRequestException(
        'Current booking privacy consent is required.',
      );
    }

    const selectedPlan = dto.selectedPlan ?? dto.plan ?? 'single';
    const offeringSelections = dto.offerings?.length
      ? dto.offerings
      : (dto.offeringSlugs ?? []).map((offeringSlug) => ({
          offeringSlug,
          quantity: 1,
        }));
    const offeringSlugs = offeringSelections.map(
      (selection) => selection.offeringSlug,
    );
    if (new Set(offeringSlugs).size !== offeringSlugs.length) {
      throw new BadRequestException('Duplicate offerings are not allowed');
    }
    if (
      offeringSelections.some(
        (selection) =>
          !Number.isInteger(selection.quantity) || selection.quantity < 1,
      )
    ) {
      throw new BadRequestException(
        'Offering quantity must be a positive integer',
      );
    }
    const offeringQuantityBySlug = new Map(
      offeringSelections.map((selection) => [
        selection.offeringSlug,
        selection.quantity,
      ]),
    );
    const dakshinaAmount = dto.dakshinaAmount ?? 0;
    if (dakshinaAmount < 0) {
      throw new BadRequestException('Dakshina amount cannot be negative');
    }
    const pooja = await this._prismaService.pooja.findFirst({
      where: {
        slug: dto.poojaSlug,
        isActive: true,
        temple: { isActive: true },
      },
      include: {
        translations: true,
        offerings: {
          where: {
            slug: { in: offeringSlugs },
            isActive: true,
            deletedAt: null,
          },
          include: { translations: true },
        },
        temple: {
          select: {
            id: true,
            imageKey: true,
            state: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            translations: true,
          },
        },
      },
    });

    if (!pooja) {
      throw new NotFoundException('Pooja not found');
    }

    if (offeringSlugs.length !== (pooja.offerings ?? []).length) {
      throw new BadRequestException(
        'One or more offerings are unavailable for this pooja',
      );
    }

    if (selectedPlan === 'weekly' && !pooja.isWeekly) {
      throw new BadRequestException('Weekly booking is not available');
    }

    const bookingType =
      selectedPlan === 'weekly' ? BookingType.WEEKLY : BookingType.SINGLE;
    const platformFeeGstPercentage = this._getConfiguredPercentage(
      'PLATFORM_FEE_GST_PERCENT',
      18,
    );
    const baseAmount = Number(pooja.baseAmount);
    const templeUnitAmount = Number(pooja.templeAmount);
    const poojaUnitAmount = Number(pooja.sellingPrice);
    const devoteeCount = dto.devotee.devotees.length;
    const poojaAmount = this._roundMoney(poojaUnitAmount * devoteeCount);
    const templePoojaAmount = this._roundMoney(templeUnitAmount * devoteeCount);
    const poojaMargin = this._calculateMarginBreakdown(
      templePoojaAmount,
      poojaAmount,
      platformFeeGstPercentage,
    );
    const poojaPlatformFee = poojaMargin.platformFee;
    const poojaPlatformFeeGst = poojaMargin.platformFeeGst;
    const offeringItems = (pooja.offerings ?? []).map((offering) => {
      const discountedPrice = Number(offering.sellingPrice);
      const customerPrice =
        discountedPrice > 0 ? discountedPrice : Number(offering.basePrice);
      const templePrice = Number(offering.templeAmount);
      const quantity = offeringQuantityBySlug.get(offering.slug) ?? 1;
      const total = this._roundMoney(templePrice * quantity);
      const customerTotal = this._roundMoney(customerPrice * quantity);
      const margin = this._calculateMarginBreakdown(
        total,
        customerTotal,
        platformFeeGstPercentage,
      );
      return {
        offeringId: offering.id,
        offeringSlug: offering.slug,
        nameSnapshot: this._getOfferingName(offering.translations),
        priceSnapshot: templePrice,
        quantity,
        total,
        platformFee: margin.platformFee,
        platformFeeGst: margin.platformFeeGst,
        customerTotal,
      };
    });
    const offeringTotal = this._roundMoney(
      offeringItems.reduce((sum, offering) => sum + offering.total, 0),
    );
    const offeringPlatformFee = this._roundMoney(
      offeringItems.reduce((sum, offering) => sum + offering.platformFee, 0),
    );
    const offeringPlatformFeeGst = this._roundMoney(
      offeringItems.reduce((sum, offering) => sum + offering.platformFeeGst, 0),
    );
    const platformFeeAmount = this._roundMoney(
      poojaPlatformFee + offeringPlatformFee,
    );
    const platformFeeGstAmount = this._roundMoney(
      poojaPlatformFeeGst + offeringPlatformFeeGst,
    );
    const templePayableAmount = this._roundMoney(
      templePoojaAmount + offeringTotal + dakshinaAmount,
    );
    const finalAmount = this._roundMoney(
      poojaAmount +
        offeringItems.reduce(
          (sum, offering) => sum + offering.customerTotal,
          0,
        ) +
        dakshinaAmount,
    );
    const amountInPaise = Math.round(finalAmount * 100);
    const recurringWeeklyAmount = poojaAmount;
    const recurringAmountInPaise = Math.round(recurringWeeklyAmount * 100);
    if (amountInPaise <= 0) {
      throw new BadRequestException('Booking amount must be greater than zero');
    }
    if (selectedPlan === 'weekly' && recurringAmountInPaise <= 0) {
      throw new BadRequestException(
        'Weekly recurring pooja amount must be greater than zero',
      );
    }
    if (
      selectedPlan === 'weekly' &&
      amountInPaise > this._upiAutoPayLimitPaise
    ) {
      throw new BadRequestException(
        'Weekly UPI AutoPay amount cannot exceed INR 15,000',
      );
    }

    const bookingNumber = this._createBookingNumber();
    const expiresAt = new Date(Date.now() + this._paymentTtlMs);
    const created = await this._prismaService.$transaction(async (prisma) => {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber,
          userId,
          poojaId: pooja.id,
          templeId: pooja.templeId,
          devoteeSnapshot: this._toJson(
            this._createDevoteeSnapshot(dto.devotee),
          ),
          poojaSnapshot: this._toJson(pooja),
          templeSnapshot: this._toJson(
            this._createTempleSnapshot(pooja.temple),
          ),
          addressSnapshot: this._toJson(dto.address),
          bookingWhatsappNumber: dto.devotee.whatsappNumber,
          devoteeAuthorityConfirmed: dto.devoteeAuthorityConfirmed,
          devoteeAuthorityConfirmedAt: new Date(),
          privacyNoticeVersion: dto.privacyNoticeVersion,
          sankalpa: this._normalizeOptionalText(dto.sankalpa),
          type: bookingType,
          baseAmount: templeUnitAmount,
          discountAmount: poojaUnitAmount,
          platformFeeAmount,
          platformFeeGstAmount,
          poojaPlatformFeeAmount: poojaPlatformFee,
          poojaPlatformFeeGstAmount: poojaPlatformFeeGst,
          templePayableAmount,
          finalAmount,
          dakshinaAmount,
          offeringTotal,
          offerings: {
            create: offeringItems.map((item) => ({
              offeringId: item.offeringId,
              nameSnapshot: item.nameSnapshot,
              priceSnapshot: item.priceSnapshot,
              quantity: item.quantity,
              total: item.total,
              platformFee: item.platformFee,
              platformFeeGst: item.platformFeeGst,
            })),
          },
          devotees: {
            create: dto.devotee.devotees.map((devotee, position) => ({
              name: devotee.name.trim(),
              naal: devotee.naal.trim(),
              position,
            })),
          },
          bookingDate: new Date(),
          poojaDate: this._getNextPoojaDate(pooja.poojaDay, pooja.time),
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
      if (dto.address) {
        await this._saveAddress(prisma, userId, dto.address, dto.devotee.state);
      }
      const transaction = await prisma.transaction.create({
        data: {
          bookingId: booking.id,
          type:
            selectedPlan === 'weekly' ? PaymentMethod.UPI : PaymentMethod.CARD,
          provider: PaymentProvider.RAZORPAY,
          amount: finalAmount,
          status: PaymentStatus.PENDING,
        },
      });
      const paymentOrder =
        bookingType === BookingType.SINGLE
          ? await prisma.paymentOrder.create({
              data: {
                transactionId: transaction.id,
                receipt: booking.bookingNumber,
                amountMinor: BigInt(amountInPaise),
                currency: this._currency,
                status: PaymentOrderStatus.CREATING,
                expiresAt,
                metadata: {},
              },
            })
          : null;

      return { booking, transaction, paymentOrder };
    });

    const isWeeklyPlan = selectedPlan === 'weekly';
    const payment = isWeeklyPlan
      ? await this._createWeeklySubscription(
          created.booking.id,
          created.transaction.id,
          recurringAmountInPaise,
          amountInPaise,
          pooja.translations[0]?.name ?? 'Weekly Pooja',
          created.booking.poojaDate,
        )
      : await this._createSinglePayment(
          created.booking.id,
          created.transaction.id,
          created.booking.bookingNumber,
          created.paymentOrder!,
          amountInPaise,
          expiresAt,
          dto.devotee.devotees[0].name.trim(),
          dto.devotee.whatsappNumber,
        );
    return {
      publicToken: payment.publicToken,
      bookingReference: created.booking.publicId,
      transactionReference: created.transaction.publicId,
      keyId: this._razorpayClientService.keyId,
      amount: amountInPaise,
      currency: this._currency,
      gatewayMode: isWeeklyPlan ? 'subscription' : 'order',
      orderId: payment.orderId,
      subscriptionId: payment.subscriptionId,
      status: isWeeklyPlan ? 'subscription_pending' : 'pending',
      expiresAt: payment.expiresAt.toISOString(),
      serverTime: new Date().toISOString(),
      redirectUrl: payment.redirectUrl,
      gatewayReference: payment.gatewayReference,
      priceBreakdown: {
        poojaBaseAmount: baseAmount,
        poojaUnitAmount,
        devoteeCount,
        poojaAmount,
        offerings: offeringItems.map((item) => ({
          offeringSlug: item.offeringSlug,
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unitAmount: this._roundMoney(item.customerTotal / item.quantity),
          total: item.customerTotal,
        })),
        offeringTotal: this._roundMoney(
          offeringItems.reduce(
            (sum, offering) => sum + offering.customerTotal,
            0,
          ),
        ),
        dakshinaAmount,
        grandTotal: finalAmount,
        recurringWeeklyAmount,
        currency: this._currency,
      },
      prefill: {
        name: dto.devotee.devotees[0].name,
        contact: dto.devotee.whatsappNumber,
      },
    };
  }

  private async _createSinglePayment(
    bookingId: string,
    transactionId: string,
    bookingNumber: string,
    localOrder: { id: string; publicId: string },
    amountInPaise: number,
    expiresAt: Date,
    customerName: string,
    customerContact: string,
  ): Promise<{
    publicToken: string;
    orderId: string;
    subscriptionId?: undefined;
    redirectUrl?: undefined;
    expiresAt: Date;
    gatewayReference: string;
  }> {
    try {
      const order = await this._razorpayClientService.createOrder({
        amount: amountInPaise,
        currency: this._currency,
        receipt: bookingNumber,
        notes: {
          bookingId,
          transactionId,
          payment_ref: localOrder.publicId,
          customer_name: customerName,
          customer_contact: customerContact,
        },
      });
      await this._prismaService.$transaction([
        this._prismaService.transaction.update({
          where: { id: transactionId },
          data: {
            providerOrderId: order.id,
            status: PaymentStatus.PROCESSING,
          },
        }),
        this._prismaService.paymentOrder.update({
          where: { id: localOrder.id },
          data: {
            providerOrderId: order.id,
            status: PaymentOrderStatus.CREATED,
            version: { increment: 1 },
          },
        }),
      ]);
      return {
        publicToken: localOrder.publicId,
        orderId: order.id,
        expiresAt,
        gatewayReference: order.id,
      };
    } catch (error) {
      await this._markCheckoutCreationFailed(
        bookingId,
        transactionId,
        localOrder.id,
      );
      throw error;
    }
  }

  private async _createWeeklySubscription(
    bookingId: string,
    transactionId: string,
    recurringAmountInPaise: number,
    initialAmountInPaise: number,
    name: string,
    poojaDate: Date,
  ): Promise<{
    publicToken: string;
    orderId?: undefined;
    subscriptionId: string;
    redirectUrl?: string;
    expiresAt: Date;
    gatewayReference: string;
  }> {
    try {
      let plan = await this._prismaService.paymentPlan.findFirst({
        where: {
          amountMinor: BigInt(recurringAmountInPaise),
          currency: this._currency,
          intervalCount: 1,
          isActive: true,
        },
      });
      if (!plan) {
        const providerPlan = await this._razorpayClientService.createPlan({
          name,
          amount: recurringAmountInPaise,
          currency: this._currency,
          interval: 1,
          notes: { bookingId },
        });
        plan = await this._prismaService.paymentPlan.create({
          data: {
            providerPlanId: providerPlan.id,
            name,
            amountMinor: BigInt(recurringAmountInPaise),
            currency: this._currency,
            intervalCount: 1,
            metadata: {},
          },
        });
      }
      const local = await this._prismaService.paymentSubscription.create({
        data: {
          transactionId,
          planId: plan.id,
          status: SubscriptionStatus.CREATING,
          totalCount: this._weeklySubscriptionCycles,
          metadata: { initialAmountMinor: initialAmountInPaise },
        },
      });
      const provider = await this._razorpayClientService.createSubscription({
        planId: plan.providerPlanId!,
        totalCount: this._weeklySubscriptionCycles,
        startAt: Math.floor(
          this._getFirstRecurringChargeAt(poojaDate).getTime() / 1000,
        ),
        upfront: {
          name: `${name} - first week`,
          amount: initialAmountInPaise,
          currency: this._currency,
        },
        notes: {
          booking_ref: bookingId,
          subscription_ref: local.publicId,
        },
      });
      const subscriptionExpiresAt = new Date(Date.now() + this._paymentTtlMs);
      await this._prismaService.$transaction([
        this._prismaService.paymentSubscription.update({
          where: { id: local.id },
          data: {
            providerSubscriptionId: provider.id,
            status: SubscriptionStatus.CREATED,
            chargeAt: provider.chargeAt
              ? new Date(provider.chargeAt * 1000)
              : null,
            version: { increment: 1 },
          },
        }),
        this._prismaService.paymentMandate.create({
          data: { subscriptionId: local.id, status: 'PENDING' },
        }),
        this._prismaService.booking.update({
          where: { id: bookingId },
          data: { subscriptionId: local.id },
        }),
        this._prismaService.transaction.update({
          where: { id: transactionId },
          data: { status: PaymentStatus.PROCESSING },
        }),
      ]);
      return {
        publicToken: local.publicId,
        subscriptionId: provider.id,
        redirectUrl: provider.shortUrl,
        expiresAt: subscriptionExpiresAt,
        gatewayReference: provider.id,
      };
    } catch (error) {
      await this._markCheckoutCreationFailed(bookingId, transactionId);
      throw error;
    }
  }

  private async _markCheckoutCreationFailed(
    bookingId: string,
    transactionId: string,
    paymentOrderId?: string,
  ): Promise<void> {
    await this._prismaService.$transaction([
      this._prismaService.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAYMENT_FAILED },
      }),
      this._prismaService.transaction.update({
        where: { id: transactionId },
        data: { status: PaymentStatus.FAILED },
      }),
      ...(paymentOrderId
        ? [
            this._prismaService.paymentOrder.update({
              where: { id: paymentOrderId },
              data: { status: PaymentOrderStatus.FAILED },
            }),
          ]
        : []),
    ]);
  }

  async getMyPoojas(
    userId: string,
    { page, limit, search, status }: GetMyPoojasQueryDto,
  ): Promise<PaginatedMyPoojas> {
    await this._bookingLifecycleService?.completeDueBookings();

    const normalizedSearch = search?.trim();
    const filters: Prisma.BookingWhereInput[] = [
      { userId },
      { transactions: { some: { status: PaymentStatus.SUCCESS } } },
    ];

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
        orderBy: { poojaDate: 'desc' },
        skip,
        take: limit,
      }),
      this._prismaService.booking.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const items = bookings.map((booking) => this._createMyPoojaItem(booking));

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

  async getLastBookingDevoteeDetails(
    userId: string,
  ): Promise<LastBookingDevoteeDetails | null> {
    const booking = await this._prismaService.booking.findFirst({
      where: {
        userId,
        transactions: { some: { status: PaymentStatus.SUCCESS } },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        devoteeSnapshot: true,
        addressSnapshot: true,
        bookingWhatsappNumber: true,
      },
    });

    if (!booking) return null;

    const devoteeSnapshot = this._asRecord(booking.devoteeSnapshot);
    const addressSnapshot = this._asRecord(booking.addressSnapshot);
    const address = {
      houseNo: this._getStringValue(addressSnapshot.houseNo) ?? '',
      streetName: this._getStringValue(addressSnapshot.streetName) ?? '',
      pincode: this._getStringValue(addressSnapshot.pincode) ?? '',
      district: this._getStringValue(addressSnapshot.district) ?? '',
      state: this._getStringValue(addressSnapshot.state) ?? '',
      phoneNumber: this._getStringValue(addressSnapshot.phoneNumber) ?? '',
    };

    return {
      devotees: this._getDevotees(devoteeSnapshot),
      whatsappNumber: booking.bookingWhatsappNumber,
      state: this._getStringValue(devoteeSnapshot.state) ?? '',
      address: Object.values(address).some(Boolean) ? address : null,
    };
  }
  private async _saveAddress(
    prisma: Prisma.TransactionClient,
    userId: string,
    address: CheckoutAddressDto,
    fallbackState: string,
  ): Promise<void> {
    const current = await prisma.address.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    const data = {
      houseNo: address.houseNo?.trim() ?? '',
      roadName: address.streetName.trim(),
      pincode: address.pincode.trim(),
      district: address.district.trim(),
      state: address.state?.trim() || fallbackState.trim(),
      phoneNumber: address.phoneNumber,
      isDefault: true,
    };

    if (current) {
      await prisma.address.update({ where: { id: current.id }, data });
      return;
    }

    await prisma.address.create({ data: { ...data, userId } });
  }
  private _normalizeOptionalText(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }

  private _createDevoteeSnapshot(
    devotee: CreateCheckoutSessionDto['devotee'],
  ): DevoteeSnapshot {
    const specialRequest = this._normalizeOptionalText(devotee.specialRequest);

    return {
      devotees: devotee.devotees.map((item) => ({
        name: item.name.trim(),
        naal: item.naal.trim(),
      })),
      whatsappNumber: devotee.whatsappNumber,
      state: devotee.state,
      ...(specialRequest ? { specialRequest } : {}),
    };
  }

  private _getOfferingName(
    translations: Array<{ language: string; name: string }>,
  ): string {
    return (
      translations.find((translation) => translation.language === 'EN')?.name ??
      translations[0]?.name ??
      'Offering'
    );
  }

  private _getConfiguredPercentage(key: string, fallback: number): number {
    const value = Number(this._configService?.get<string>(key) ?? fallback);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  private _calculateMarginBreakdown(
    templeAmount: number,
    customerAmount: number,
    gstPercentage: number,
  ): { platformFee: number; platformFeeGst: number } {
    const grossMargin = this._roundMoney(customerAmount - templeAmount);
    if (grossMargin < 0) {
      throw new BadRequestException(
        'Customer selling price cannot be less than temple amount',
      );
    }
    const platformFee = this._roundMoney(
      grossMargin / (1 + gstPercentage / 100),
    );
    return {
      platformFee,
      platformFeeGst: this._roundMoney(grossMargin - platformFee),
    };
  }
  private _roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  private _createBookingNumber(): string {
    return `YGM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private _getFirstRecurringChargeAt(poojaDate: Date): Date {
    const indiaDate = new Date(poojaDate.getTime() + this._indiaOffsetMs);
    const recurringChargeUtcMs =
      Date.UTC(
        indiaDate.getUTCFullYear(),
        indiaDate.getUTCMonth(),
        indiaDate.getUTCDate() + 6,
        23,
      ) - this._indiaOffsetMs;

    return new Date(recurringChargeUtcMs);
  }

  private _getNextPoojaDate(dayName: string, time?: string): Date {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const now = new Date();
    const indiaNow = new Date(now.getTime() + this._indiaOffsetMs);
    const normalizedDayName = dayName.trim().toLowerCase();
    const targetDay = days.indexOf(normalizedDayName);
    const poojaTime = this._parsePoojaTime(time);

    if (targetDay === -1 || normalizedDayName === 'any') {
      return this._createIndiaDate(indiaNow, 1, poojaTime);
    }

    let daysUntil = (targetDay - indiaNow.getUTCDay() + 7) % 7;

    if (daysUntil === 0) {
      daysUntil = 7;
    } else if (daysUntil === 1 && indiaNow.getUTCHours() >= 12) {
      daysUntil = 8;
    }

    return this._createIndiaDate(indiaNow, daysUntil, poojaTime);
  }

  private _parsePoojaTime(time?: string): { hours: number; minutes: number } {
    const normalizedTime = time?.trim();

    if (!normalizedTime) {
      return { hours: 0, minutes: 0 };
    }

    const match = normalizedTime.match(
      /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/i,
    );

    if (!match) {
      return { hours: 0, minutes: 0 };
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3]?.toLowerCase();

    if (minutes > 59 || hours > (meridiem ? 12 : 23)) {
      return { hours: 0, minutes: 0 };
    }

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    }

    if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  private _createIndiaDate(
    indiaNow: Date,
    daysUntil: number,
    time: { hours: number; minutes: number },
  ): Date {
    const indiaTimestamp = Date.UTC(
      indiaNow.getUTCFullYear(),
      indiaNow.getUTCMonth(),
      indiaNow.getUTCDate() + daysUntil,
      time.hours,
      time.minutes,
    );

    return new Date(indiaTimestamp - this._indiaOffsetMs);
  }

  private _createTempleSnapshot<T extends object>(temple: T): Omit<T, 'email'> {
    const safeTemple = { ...temple };

    delete (safeTemple as T & { email?: string }).email;

    return safeTemple;
  }

  private _toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private _createMyPoojaItem(booking: BookingWithTransactions): MyPoojaItem {
    const poojaSnapshot = this._asRecord(booking.poojaSnapshot);
    const templeSnapshot = this._asRecord(booking.templeSnapshot);
    const devoteeSnapshot = this._asRecord(booking.devoteeSnapshot);
    const imageKeys = this._getStringArray(poojaSnapshot.imageKeys);
    const imageUrls = imageKeys.map((imageKey) =>
      this._imageService.getCardImage(imageKey),
    );

    return {
      reference: booking.publicId,
      bookingNumber: booking.bookingNumber,
      pooja: {
        slug: this._getStringValue(poojaSnapshot.slug) ?? '',
        name: this._getTranslatedName(poojaSnapshot) ?? 'Pooja',
        imageUrls: imageUrls.filter((imageUrl): imageUrl is string =>
          Boolean(imageUrl),
        ),
      },
      temple: {
        slug: this._getStringValue(templeSnapshot.slug) ?? '',
        name: this._getTranslatedName(templeSnapshot) ?? 'Temple',
      },
      poojaDay: this._getStringValue(poojaSnapshot.poojaDay),
      poojaTime: this._getStringValue(poojaSnapshot.time),
      bookingDate: booking.bookingDate,
      poojaDate: booking.poojaDate,
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
      devotees: this._getDevotees(devoteeSnapshot),
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
      ? value
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

  private _getDevotees(snapshot: SnapshotRecord): Array<{
    name: string;
    naal: string;
  }> {
    const devotees = Array.isArray(snapshot.devotees)
      ? snapshot.devotees
          .map((item) => this._asRecordFromUnknown(item))
          .filter((item): item is SnapshotRecord => Boolean(item))
          .map((item) => ({
            name: this._getStringValue(item.name),
            naal: this._getStringValue(item.naal),
          }))
          .filter((item): item is { name: string; naal: string } =>
            Boolean(item.name && item.naal),
          )
      : [];

    if (devotees.length > 0) {
      return devotees;
    }

    const legacyName = this._getStringValue(snapshot.name);
    const legacyNaal = this._getStringValue(snapshot.naal);

    return legacyName && legacyNaal
      ? [{ name: legacyName, naal: legacyNaal }]
      : [];
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
        return 'Payment Pending';
      case BookingStatus.PAYMENT_FAILED:
        return 'Payment Failed';
      case BookingStatus.CONFIRMED:
        return 'Booked';
      case BookingStatus.SCHEDULED:
        return 'Scheduled';
      case BookingStatus.COMPLETED:
        return 'Completed';
      case BookingStatus.CANCELLED:
        return 'Cancelled';
      case BookingStatus.REFUNDED:
        return 'Refunded';
    }
  }
}
