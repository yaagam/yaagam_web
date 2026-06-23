import {
  BadRequestException,
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
import PrismaService from '../../../prisma/prisma.service';
import { CreateCheckoutSessionDto } from '../dtos/create-checkout-session.dto';
import { RazorpayClientService } from './razorpay-client.service';

export interface CheckoutSession {
  bookingId: string;
  transactionId: string;
  keyId: string;
  amount: number;
  currency: string;
  gatewayMode: 'order' | 'subscription' | 'autopay-qr';
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  gatewayReference: string;
  prefill: {
    name: string;
    contact: string;
  };
}

@Injectable()
export class BookingsService {
  private readonly _currency = 'INR';

  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _razorpayClientService: RazorpayClientService,
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
          type: bookingType,
          baseAmount,
          discountAmount,
          finalAmount,
          bookingDate: this._getNextBookingDate(pooja.poojaDay),
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

  private _calculateDiscount(amount: number, percentage: number): number {
    return Math.round(((amount * percentage) / 100) * 100) / 100;
  }

  private _createBookingNumber(): string {
    return `YGM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private _getNextBookingDate(dayName: string): Date {
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

    return bookingDate;
  }

  private _toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
