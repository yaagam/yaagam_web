import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  temple: { select: { zohoVendorId: true } },
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
    private readonly _configService: ConfigService,
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
    if (!occurrence || occurrence.zohoPaymentId) {
      return;
    }
    const booking = occurrence.booking;

    await this._prismaService.bookingOccurrence.update({
      where: { id: occurrence.id },
      data: { zohoSyncStatus: ZohoSyncStatus.PENDING, zohoSyncError: null },
    });

    try {
      this._validateCatalogSync(booking);
      const customerId = await this._ensureCustomer(booking);
      const salesOrderId =
        occurrence.zohoSalesOrderId ??
        (
          await this._zohoBooksService.createSalesOrder({
            bookingId: booking.id,
            customerId,
            referenceNumber: booking.bookingNumber,
            date: this._formatIndiaDate(booking.bookingDate),
            poojaDate: this._formatIndiaDate(occurrence.poojaDate),
            lineItems: this._createLineItems(booking, occurrence.sequence),
          })
        ).salesOrderId;
      if (!occurrence.zohoSalesOrderId) {
        await this._prismaService.bookingOccurrence.update({
          where: { id: occurrence.id },
          data: { zohoSalesOrderId: salesOrderId },
        });
      }
      const invoiceId =
        occurrence.zohoInvoiceId ??
        (
          await this._zohoBooksService.createInvoiceFromSalesOrder(
            booking.id,
            salesOrderId,
          )
        ).invoiceId;
      if (!occurrence.zohoInvoiceId) {
        await this._prismaService.bookingOccurrence.update({
          where: { id: occurrence.id },
          data: { zohoInvoiceId: invoiceId },
        });
      }
      const paymentDate = this._formatIndiaDate(
        occurrence.paymentAttempt.capturedAt ?? occurrence.createdAt,
      );
      const paymentId =
        occurrence.zohoPaymentId ??
        (
          await this._zohoBooksService.recordCustomerPayment({
            bookingId: booking.id,
            customerId,
            invoiceId,
            amount: Number(occurrence.paymentAttempt.amountMinor) / 100,
            date: paymentDate,
            referenceNumber:
              occurrence.paymentAttempt.providerPaymentId ??
              occurrence.publicId,
          })
        ).paymentId;
      if (!occurrence.zohoPaymentId) {
        await this._prismaService.bookingOccurrence.update({
          where: { id: occurrence.id },
          data: { zohoPaymentId: paymentId },
        });
      }
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
    if (!booking.temple.zohoVendorId) {
      throw new Error('Temple must be synced as a Zoho vendor before booking');
    }
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

  private async _ensureCustomer(booking: BookingZohoRecord): Promise<string> {
    const firstDevotee = booking.devotees[0];
    if (!firstDevotee) {
      throw new Error('Booking must have at least one devotee');
    }
    const address = this._record(booking.addressSnapshot);
    const deliveryAddress = this._hasDeliveryAddress(address)
      ? this._createDeliveryAddress(address, firstDevotee.name)
      : undefined;
    const customerInput = {
      userId: booking.userId,
      name: firstDevotee.name,
      phone: booking.bookingWhatsappNumber,
      billingAddress: deliveryAddress,
      shippingAddress: deliveryAddress,
    };
    if (booking.user.zohoCustomerId) {
      await this._zohoBooksService.updateCustomer({
        ...customerInput,
        customerId: booking.user.zohoCustomerId,
      });
      return booking.user.zohoCustomerId;
    }
    const customer = await this._zohoBooksService.createCustomer(customerInput);
    await this._prismaService.user.update({
      where: { id: booking.userId },
      data: { zohoCustomerId: customer.customerId },
    });
    return customer.customerId;
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
    const platformFeeItemId = this._configService
      .getOrThrow<string>('ZOHO_PLATFORM_FEE_ITEM_ID')
      .trim();
    if (!platformFeeItemId) {
      throw new Error('ZOHO_PLATFORM_FEE_ITEM_ID must not be empty');
    }

    const devoteeCount = booking.devotees.length;
    const items: ZohoSalesOrderLineItem[] = [
      {
        itemId: booking.pooja!.zohoItemId!,
        name: poojaName,
        rate: Number(booking.baseAmount),
        quantity: devoteeCount,
      },
    ];

    this._appendPlatformFeeItem(
      items,
      platformFeeItemId,
      Number(booking.poojaPlatformFeeAmount),
      devoteeCount,
    );

    if (sequence === 1) {
      for (const offering of booking.offerings) {
        items.push({
          itemId: offering.offering.zohoItemId!,
          name: offering.nameSnapshot,
          rate: Number(offering.priceSnapshot),
          quantity: offering.quantity,
        });
        this._appendPlatformFeeItem(
          items,
          platformFeeItemId,
          Number(offering.platformFee),
          offering.quantity,
        );
      }

      if (Number(booking.dakshinaAmount) > 0) {
        items.push({
          name: 'Dakshina',
          rate: Number(booking.dakshinaAmount),
          quantity: 1,
        });
      }
    }

    return items;
  }

  private _appendPlatformFeeItem(
    items: ZohoSalesOrderLineItem[],
    itemId: string,
    totalFeeBeforeGst: number,
    quantity: number,
  ): void {
    if (totalFeeBeforeGst <= 0 || quantity <= 0) return;

    items.push({
      itemId,
      name: 'YAAGAM_PLATFORM_FEE',
      rate: this._roundMoney(totalFeeBeforeGst / quantity),
      quantity,
    });
  }
  private _createDeliveryAddress(
    address: JsonRecord,
    attention: string,
  ): ZohoCustomerAddress {
    return {
      attention,
      address: this._joinAddress(address.houseNo, address.streetName),
      street2: this._string(address.location),
      city: this._string(address.district),
      state: this._string(address.state),
      zip: this._string(address.pincode),
      country: 'India',
      phone: this._string(address.phoneNumber),
    };
  }

  private _hasDeliveryAddress(address: JsonRecord): boolean {
    return [
      address.houseNo,
      address.streetName,
      address.location,
      address.district,
      address.state,
      address.pincode,
    ].some((value) => Boolean(this._string(value)));
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
