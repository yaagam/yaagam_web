import { Inject, Injectable } from '@nestjs/common';
import { Language, Prisma, ZohoSyncStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import { ZOHO_BOOKS_SERVICE } from '../../../integrations/zoho/constants/zoho-service-token.const';
import type {
  IZohoBooksService,
  ZohoCustomerAddress,
  ZohoSalesOrderLineItem,
} from '../../../integrations/zoho/services/zoho-books.service.interface';
import type { IBookingZohoSyncService } from './booking-zoho-sync.service.interface';

const bookingZohoInclude = Prisma.validator<Prisma.BookingInclude>()({
  user: { select: { id: true, zohoCustomerId: true } },
  pooja: { include: { translations: true } },
  devotees: { orderBy: { position: 'asc' } },
  offerings: {
    include: {
      offering: { include: { translations: true } },
    },
  },
});

type BookingZohoRecord = Prisma.BookingGetPayload<{
  include: typeof bookingZohoInclude;
}>;
type JsonRecord = Record<string, unknown>;

@Injectable()
export class BookingZohoSyncService implements IBookingZohoSyncService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(ZOHO_BOOKS_SERVICE)
    private readonly _zohoBooksService: IZohoBooksService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(BookingZohoSyncService.name);
  }

  async syncPaidOccurrence(occurrenceId: string): Promise<void> {
    const occurrence = await this._prismaService.bookingOccurrence.findUnique({
      where: { id: occurrenceId },
      include: {
        booking: { include: bookingZohoInclude },
        paymentAttempt: {
          select: {
            providerPaymentId: true,
            capturedAt: true,
            amountMinor: true,
            currency: true,
          },
        },
      },
    });
    if (!occurrence || occurrence.zohoPaymentId) return;
    const booking = occurrence.booking;

    await this._prismaService.bookingOccurrence.update({
      where: { id: occurrence.id },
      data: { zohoSyncStatus: ZohoSyncStatus.PENDING, zohoSyncError: null },
    });

    try {
      this._validateCatalogSync(booking);
      const customerId =
        booking.user.zohoCustomerId ??
        (await this._createCustomer(booking)).customerId;
      const { salesOrderId } = await this._zohoBooksService.createSalesOrder({
        bookingId: booking.id,
        customerId,
        referenceNumber: booking.bookingNumber,
        date: this._formatIndiaDate(booking.bookingDate),
        poojaDate: this._formatIndiaDate(occurrence.poojaDate),
        lineItems: this._createLineItems(booking, occurrence.sequence),
        notes: this._createBookingNotes(booking, occurrence.sequence),
      });
      const { invoiceId } =
        await this._zohoBooksService.createInvoiceFromSalesOrder(
          booking.id,
          salesOrderId,
        );
      const { paymentId } = await this._zohoBooksService.recordCustomerPayment({
        bookingId: booking.id,
        customerId,
        invoiceId,
        amount: Number(occurrence.paymentAttempt.amountMinor) / 100,
        date: this._formatIndiaDate(
          occurrence.paymentAttempt.capturedAt ?? occurrence.createdAt,
        ),
        referenceNumber:
          occurrence.paymentAttempt.providerPaymentId ?? occurrence.publicId,
      });
      await this._prismaService.bookingOccurrence.update({
        where: { id: occurrence.id },
        data: {
          zohoSalesOrderId: salesOrderId,
          zohoInvoiceId: invoiceId,
          zohoPaymentId: paymentId,
          zohoSyncStatus: ZohoSyncStatus.SYNCED,
          zohoSyncError: null,
          lastZohoSyncAt: new Date(),
        },
      });
      if (occurrence.sequence === 1) {
        await this._prismaService.booking.update({
          where: { id: booking.id },
          data: {
            zohoSalesOrderId: salesOrderId,
            zohoSyncStatus: ZohoSyncStatus.SYNCED,
            zohoSyncError: null,
            lastZohoSyncAt: new Date(),
          },
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown Zoho booking sync error';
      await this._prismaService.bookingOccurrence.update({
        where: { id: occurrence.id },
        data: {
          zohoSyncStatus: ZohoSyncStatus.FAILED,
          zohoSyncError: message,
        },
      });
      this._logger.error(
        {
          bookingId: booking.id,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : String(error),
        },
        'Zoho booking sales-order sync failed',
      );
    }
  }

  private _validateCatalogSync(booking: BookingZohoRecord): void {
    if (!booking.pooja?.zohoItemId) {
      throw new Error('Pooja must be synced with Zoho before booking');
    }
    const unsyncedOffering = booking.offerings.find(
      (item) => !item.offering.zohoItemId,
    );
    if (unsyncedOffering) {
      throw new Error(
        `Offering ${unsyncedOffering.nameSnapshot} must be synced with Zoho before booking`,
      );
    }
  }

  private async _createCustomer(
    booking: BookingZohoRecord,
  ): Promise<{ customerId: string }> {
    const firstDevotee = booking.devotees[0];
    if (!firstDevotee) {
      throw new Error('Booking must have at least one devotee');
    }
    const address = this._record(booking.addressSnapshot);
    const devoteeSnapshot = this._record(booking.devoteeSnapshot);
    const customer = await this._zohoBooksService.createCustomer({
      userId: booking.userId,
      name: firstDevotee.name,
      phone: booking.bookingWhatsappNumber,
      billingAddress: this._createBillingAddress(
        address,
        devoteeSnapshot,
        firstDevotee.name,
      ),
    });
    await this._prismaService.user.update({
      where: { id: booking.userId },
      data: { zohoCustomerId: customer.customerId },
    });
    return customer;
  }

  private _createLineItems(
    booking: BookingZohoRecord,
    sequence: number,
  ): ZohoSalesOrderLineItem[] {
    const poojaName =
      booking.pooja!.translations.find(
        (translation) => translation.language === Language.EN,
      )?.name ??
      booking.pooja!.translations[0]?.name ??
      'Pooja';
    const items: ZohoSalesOrderLineItem[] = [
      {
        itemId: booking.pooja!.zohoItemId!,
        name: poojaName,
        description: `${booking.type} booking for ${booking.devotees.length} devotee(s)`,
        rate: Number(booking.baseAmount),
        quantity: booking.devotees.length,
      },
      ...(sequence === 1 ? booking.offerings : []).map((item) => ({
        itemId: item.offering.zohoItemId!,
        name: item.nameSnapshot,
        description: 'Pooja offering',
        rate: Number(item.priceSnapshot),
        quantity: item.quantity,
      })),
    ];
    const platformFee =
      sequence === 1
        ? Number(booking.platformFeeAmount)
        : Number(booking.poojaPlatformFeeAmount);
    const platformFeeGst =
      sequence === 1
        ? Number(booking.platformFeeGstAmount)
        : Number(booking.poojaPlatformFeeGstAmount);
    if (platformFee > 0) {
      items.push({
        name: 'Platform service fee',
        description: 'Platform service fee included in the displayed price',
        rate: platformFee,
        quantity: 1,
      });
    }
    if (platformFeeGst > 0) {
      items.push({
        name: 'GST on platform service fee',
        description: 'GST included in the displayed price',
        rate: platformFeeGst,
        quantity: 1,
      });
    }
    if (sequence === 1 && Number(booking.dakshinaAmount) > 0) {
      items.push({
        name: 'Dakshina',
        description: 'Voluntary temple contribution',
        rate: Number(booking.dakshinaAmount),
        quantity: 1,
      });
    }
    return items;
  }

  private _createBillingAddress(
    address: JsonRecord,
    devotee: JsonRecord,
    attention: string,
  ): ZohoCustomerAddress {
    return {
      attention,
      address: this._joinAddress(address.houseNo, address.streetName),
      street2: this._string(address.location),
      city: this._string(address.district),
      state: this._string(devotee.state),
      zip: this._string(address.pincode),
      country: 'India',
      phone:
        this._string(address.phoneNumber) ??
        this._string(devotee.whatsappNumber),
    };
  }

  private _createBookingNotes(
    booking: BookingZohoRecord,
    sequence: number,
  ): string {
    const devoteeSnapshot = this._record(booking.devoteeSnapshot);
    const poojaSnapshot = this._record(booking.poojaSnapshot);
    const templeSnapshot = this._record(booking.templeSnapshot);
    return JSON.stringify({
      bookingReference: booking.publicId,
      bookingNumber: booking.bookingNumber,
      bookingType: booking.type,
      occurrence: sequence,
      paymentStatus: 'PAID',
      whatsappNumber: booking.bookingWhatsappNumber,
      pooja: {
        slug: this._string(poojaSnapshot.slug),
        date: booking.poojaDate.toISOString(),
      },
      temple: {
        slug: this._string(templeSnapshot.slug),
        state: this._string(templeSnapshot.state),
      },
      devotees: booking.devotees.map(({ name, naal }) => ({ name, naal })),
      sankalpa: booking.sankalpa,
      specialRequest: this._string(devoteeSnapshot.specialRequest),
      billingAddress: this._record(booking.addressSnapshot),
      priceBreakdown: {
        poojaCustomerUnitAmount: Number(booking.discountAmount),
        offeringTempleTotal: Number(booking.offeringTotal),
        platformFee: Number(booking.platformFeeAmount),
        platformFeeGst: Number(booking.platformFeeGstAmount),
        dakshina: Number(booking.dakshinaAmount),
        templePayable: Number(booking.templePayableAmount),
        grandTotal: Number(booking.finalAmount),
        currency: 'INR',
      },
    });
  }

  private _formatIndiaDate(value: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }

  private _record(value: unknown): JsonRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as JsonRecord)
      : {};
  }

  private _string(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private _joinAddress(...values: unknown[]): string | undefined {
    const address = values
      .map((value) => this._string(value))
      .filter((value): value is string => Boolean(value))
      .join(', ');
    return address || undefined;
  }

  private _roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
