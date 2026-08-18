import { BookingType, ZohoSyncStatus } from '@prisma/client';
import type {
  CreateZohoCustomerInput,
  CreateZohoCustomerResult,
  CreateZohoInvoiceResult,
  CreateZohoSalesOrderInput,
  CreateZohoSalesOrderResult,
  CreateZohoVendorBillInput,
  CreateZohoVendorBillResult,
  RecordZohoCustomerPaymentInput,
  RecordZohoCustomerPaymentResult,
} from '../../../integrations/zoho/services/zoho-books.service.interface';
import { BookingZohoSyncService } from './booking-zoho-sync.service';

type OccurrenceUpdateInput = {
  where: { id: string };
  data: Record<string, unknown>;
};

describe('BookingZohoSyncService', () => {
  const booking = {
    id: 'booking-id',
    publicId: 'booking-public-id',
    bookingNumber: 'YGM-2026-001',
    userId: 'user-id',
    user: { id: 'user-id', zohoCustomerId: null },
    temple: { zohoVendorId: 'zoho-temple-vendor-id' },
    bookingWhatsappNumber: '+919876543210',
    bookingDate: new Date('2026-08-10T04:30:00.000Z'),
    poojaDate: new Date('2026-08-12T03:00:00.000Z'),
    type: BookingType.SINGLE,
    baseAmount: 400,
    discountAmount: 736,
    offeringTotal: 30,
    poojaPlatformFeeAmount: 200,
    poojaPlatformFeeGstAmount: 36,
    platformFeeAmount: 212,
    platformFeeGstAmount: 38.16,
    dakshinaAmount: 100,
    templePayableAmount: 830,
    finalAmount: 1180.16,
    sankalpa: 'Family wellbeing',
    devoteeSnapshot: {
      state: 'Kerala',
      whatsappNumber: '+919876543210',
      specialRequest: 'Morning pooja',
    },
    addressSnapshot: {
      houseNo: '10',
      streetName: 'Temple Road',
      district: 'Thrissur',
      pincode: '680001',
      phoneNumber: '+919876543210',
    },
    poojaSnapshot: { slug: 'ganapathi-homam' },
    templeSnapshot: { slug: 'vadakkunnathan-temple', state: 'Kerala' },
    pooja: {
      zohoItemId: 'zoho-pooja-item',
      translations: [{ language: 'EN', name: 'Ganapathi Homam' }],
    },
    devotees: [
      { name: 'First Devotee', naal: 'Aswathi', position: 0 },
      { name: 'Second Devotee', naal: 'Bharani', position: 1 },
    ],
    offerings: [
      {
        nameSnapshot: 'Flowers',
        priceSnapshot: 30,
        total: 30,
        platformFee: 12,
        platformFeeGst: 2.16,
        quantity: 1,
        offering: {
          zohoItemId: 'zoho-offering-item',
          translations: [{ language: 'EN', name: 'Flowers' }],
        },
      },
    ],
  };
  const occurrence = {
    id: 'occurrence-id',
    publicId: 'occurrence-public-id',
    sequence: 1,
    poojaDate: booking.poojaDate,
    createdAt: new Date('2026-08-10T05:00:00.000Z'),
    zohoPaymentId: null,
    zohoBillId: null,
    zohoSalesOrderId: null,
    zohoInvoiceId: null,
    booking,
    paymentAttempt: {
      providerPaymentId: 'pay_123',
      capturedAt: new Date('2026-08-10T05:00:00.000Z'),
      amountMinor: BigInt(118016),
      currency: 'INR',
    },
  };

  function createService() {
    const prismaService = {
      bookingOccurrence: {
        findUnique: jest.fn().mockResolvedValue(occurrence),
        update: jest
          .fn<Promise<void>, [OccurrenceUpdateInput]>()
          .mockResolvedValue(undefined),
      },
      booking: { update: jest.fn().mockResolvedValue(undefined) },
      user: { update: jest.fn().mockResolvedValue(undefined) },
    };
    const zohoBooksService = {
      createCustomer: jest
        .fn<Promise<CreateZohoCustomerResult>, [CreateZohoCustomerInput]>()
        .mockResolvedValue({ customerId: 'zoho-customer-id' }),
      updateCustomer: jest.fn().mockResolvedValue(undefined),
      createSalesOrder: jest
        .fn<Promise<CreateZohoSalesOrderResult>, [CreateZohoSalesOrderInput]>()
        .mockResolvedValue({ salesOrderId: 'zoho-sales-order-id' }),
      createInvoiceFromSalesOrder: jest
        .fn<Promise<CreateZohoInvoiceResult>, [string, string]>()
        .mockResolvedValue({ invoiceId: 'zoho-invoice-id' }),
      recordCustomerPayment: jest
        .fn<
          Promise<RecordZohoCustomerPaymentResult>,
          [RecordZohoCustomerPaymentInput]
        >()
        .mockResolvedValue({ paymentId: 'zoho-payment-id' }),
      createVendorBill: jest
        .fn<Promise<CreateZohoVendorBillResult>, [CreateZohoVendorBillInput]>()
        .mockResolvedValue({ billId: 'zoho-bill-id' }),
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('zoho-platform-fee-item'),
    };
    const logger = { setContext: jest.fn(), error: jest.fn() };
    return {
      service: new BookingZohoSyncService(
        prismaService as never,
        zohoBooksService as never,
        configService as never,
        logger as never,
      ),
      prismaService,
      zohoBooksService,
    };
  }

  it('creates customer, split invoice, and payment only after a paid occurrence', async () => {
    const { service, prismaService, zohoBooksService } = createService();

    await service.syncPaidOccurrence('occurrence-id');

    expect(zohoBooksService.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        name: 'First Devotee',
        phone: '+919876543210',
      }),
    );
    const customerInput = zohoBooksService.createCustomer.mock.calls[0][0];
    expect(customerInput).not.toHaveProperty('email');
    expect(customerInput.billingAddress).toMatchObject({
      attention: 'First Devotee',
      state: undefined,
      zip: '680001',
    });
    expect(customerInput.shippingAddress).toMatchObject({
      attention: 'First Devotee',
      zip: '680001',
    });
    const salesOrderInput =
      zohoBooksService.createSalesOrder.mock.calls[0]?.[0];
    expect(salesOrderInput?.bookingId).toBe('booking-id');
    expect(salesOrderInput?.customerId).toBe('zoho-customer-id');
    expect(salesOrderInput).not.toHaveProperty('notes');
    expect(salesOrderInput?.isInclusiveTax).toBe(true);
    expect(salesOrderInput?.lineItems).toContainEqual(
      expect.objectContaining({
        itemId: 'zoho-pooja-item',
        name: 'Ganapathi Homam',
        rate: 400,
        quantity: 2,
      }),
    );
    expect(salesOrderInput?.lineItems).toContainEqual(
      expect.objectContaining({
        itemId: 'zoho-offering-item',
        name: 'Flowers',
        rate: 30,
        quantity: 1,
      }),
    );
    const platformFeeItems = salesOrderInput?.lineItems.filter(
      (item) => item.name === 'YAAGAM_PLATFORM_FEE',
    );
    expect(platformFeeItems).toEqual([
      {
        itemId: 'zoho-platform-fee-item',
        name: 'YAAGAM_PLATFORM_FEE',
        rate: 250.16,
        quantity: 1,
      },
    ]);
    expect(salesOrderInput?.lineItems).not.toContainEqual(
      expect.objectContaining({ name: 'GST on platform service fee' }),
    );
    expect(salesOrderInput?.lineItems).toContainEqual(
      expect.objectContaining({ name: 'Dakshina', rate: 100 }),
    );
    expect(zohoBooksService.createInvoiceFromSalesOrder).toHaveBeenCalledWith(
      'booking-id',
      'zoho-sales-order-id',
    );
    expect(zohoBooksService.recordCustomerPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 'zoho-invoice-id',
        amount: 1180.16,
        referenceNumber: 'pay_123',
      }),
    );
    expect(zohoBooksService.createVendorBill).not.toHaveBeenCalled();
    const syncedUpdate =
      prismaService.bookingOccurrence.update.mock.calls.at(-1)?.[0];
    expect(syncedUpdate?.where).toEqual({ id: 'occurrence-id' });
    expect(syncedUpdate?.data).toMatchObject({
      zohoPaymentId: 'zoho-payment-id',
      zohoSyncStatus: ZohoSyncStatus.SYNCED,
    });
  });

  it('does not send billing or shipping addresses without prasadam delivery', async () => {
    const { service, prismaService, zohoBooksService } = createService();
    prismaService.bookingOccurrence.findUnique.mockResolvedValue({
      ...occurrence,
      booking: { ...booking, addressSnapshot: null },
    });

    await service.syncPaidOccurrence('occurrence-id');

    expect(zohoBooksService.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        billingAddress: undefined,
        shippingAddress: undefined,
      }),
    );
  });

  it('records a Zoho failure without failing payment processing', async () => {
    const { service, prismaService, zohoBooksService } = createService();
    zohoBooksService.createCustomer.mockRejectedValue(
      new Error('Zoho unavailable'),
    );

    await expect(
      service.syncPaidOccurrence('occurrence-id'),
    ).resolves.toBeUndefined();
    expect(prismaService.bookingOccurrence.update).toHaveBeenLastCalledWith({
      where: { id: 'occurrence-id' },
      data: {
        zohoSyncStatus: ZohoSyncStatus.FAILED,
        zohoSyncError: 'Zoho unavailable',
      },
    });
  });
});
