/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { BookingStatus, BookingType, PaymentStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function createService({
    prismaService = { booking: {}, pooja: {}, transaction: {} },
    razorpayClientService = { keyId: 'rzp_test', createOrder: jest.fn() },
    fileStorageService = {
      createSecureUrl: jest.fn().mockResolvedValue('https://signed.test/img'),
    },
  } = {}) {
    return new BookingsService(
      prismaService as never,
      razorpayClientService as never,
      fileStorageService as never,
    );
  }

  const booking = {
    id: 'booking-id',
    bookingNumber: 'YGM-001',
    userId: 'user-id',
    poojaId: 'pooja-id',
    templeId: 'temple-id',
    devoteeSnapshot: {
      devotees: [
        { name: 'Devotee One', naal: 'Aswathi' },
        { name: 'Devotee Two', naal: 'Bharani' },
      ],
    },
    poojaSnapshot: {
      imageKeys: ['poojas/navagraha.jpg'],
      poojaDay: 'Monday',
      translations: [
        { language: 'ML', name: 'Malayalam Name' },
        { language: 'EN', name: 'Nava Graha Pooja' },
      ],
    },
    templeSnapshot: {
      translations: [{ language: 'EN', name: 'Kottayil Kovilakam Temple' }],
    },
    addressSnapshot: {},
    bookingWhatsappNumber: '9876543210',
    type: BookingType.WEEKLY,
    baseAmount: 601,
    discountAmount: 100,
    finalAmount: 501,
    bookingDate: new Date('2026-06-29T00:00:00.000Z'),
    poojaDate: new Date('2026-06-29T00:00:00.000Z'),
    status: BookingStatus.COMPLETED,
    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    transactions: [{ status: PaymentStatus.SUCCESS }],
  };

  it('starts recurring billing at 11 PM IST before the following pooja', () => {
    const service = createService();
    const firstPooja = new Date('2026-08-02T02:30:00.000Z');

    const recurringCharge = (service as any)._getFirstRecurringChargeAt(
      firstPooja,
    );

    expect(recurringCharge).toEqual(new Date('2026-08-08T17:30:00.000Z'));
  });

  const checkoutDto = {
    poojaId: 'pooja-id',
    plan: 'single' as const,
    sankalpa: '  For family wellbeing  ',
    devotee: {
      devotees: [
        { name: 'Devotee One', naal: 'Aswathi' },
        { name: 'Devotee Two', naal: 'Bharani' },
      ],
      whatsappNumber: '9876543210',
      state: 'Kerala',
      specialRequest: '  Archana for family  ',
    },
    address: null,
  };

  it('saves optional sankalpa when creating a booking', async () => {
    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pooja-id',
          templeId: 'temple-id',
          baseAmount: 500,
          weeklyDiscount: 10,
          normalDiscount: 0,
          isWeekly: false,
          poojaDay: 'Monday',
          translations: [],
          temple: { email: 'confidential@example.com', translations: [] },
        }),
      },
      booking: {
        create: jest.fn().mockResolvedValue({
          id: 'booking-id',
          bookingNumber: 'YGM-001',
        }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'transaction-id' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      paymentOrder: {
        create: jest.fn().mockResolvedValue({
          id: 'payment-order-id',
          publicId: 'payment-public-id',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      paymentQrCode: { create: jest.fn().mockResolvedValue(undefined) },
      $transaction: jest.fn(async (input) =>
        typeof input === 'function' ? input(prismaService) : Promise.all(input),
      ),
    };
    const razorpayClientService = {
      keyId: 'rzp_test',
      createOrder: jest.fn().mockResolvedValue({
        id: 'order-id',
        amount: 100000,
        currency: 'INR',
      }),
      createQrCode: jest.fn().mockResolvedValue({
        id: 'qr-id',
        imageUrl: 'https://example.test/qr.png',
        status: 'active',
      }),
    };
    const service = createService({ prismaService, razorpayClientService });

    const session = await service.createCheckoutSession('user-id', checkoutDto);

    expect(session.priceBreakdown).toEqual(
      expect.objectContaining({
        poojaUnitAmount: 500,
        devoteeCount: 2,
        poojaAmount: 1000,
        offeringTotal: 0,
        dakshinaAmount: 0,
        grandTotal: 1000,
      }),
    );
    expect(razorpayClientService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100000 }),
    );
    expect(prismaService.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sankalpa: 'For family wellbeing',
          devoteeSnapshot: expect.objectContaining({
            devotees: [
              { name: 'Devotee One', naal: 'Aswathi' },
              { name: 'Devotee Two', naal: 'Bharani' },
            ],
            whatsappNumber: '9876543210',
            state: 'Kerala',
            specialRequest: 'Archana for family',
          }),
          devotees: {
            create: [
              { name: 'Devotee One', naal: 'Aswathi', position: 0 },
              { name: 'Devotee Two', naal: 'Bharani', position: 1 },
            ],
          },
          templeSnapshot: { translations: [] },
        }),
      }),
    );
  });
  it('schedules pooja date after the previous-day noon cutoff', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 4, 12, 0, 0));

    const prismaService = {
      pooja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pooja-id',
          templeId: 'temple-id',
          baseAmount: 500,
          weeklyDiscount: 10,
          normalDiscount: 0,
          isWeekly: false,
          poojaDay: 'Sunday',
          time: '08:30',
          translations: [],
          temple: { email: 'confidential@example.com', translations: [] },
        }),
      },
      booking: {
        create: jest.fn().mockResolvedValue({
          id: 'booking-id',
          bookingNumber: 'YGM-001',
        }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'transaction-id' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      paymentOrder: {
        create: jest.fn().mockResolvedValue({
          id: 'payment-order-id',
          publicId: 'payment-public-id',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      paymentQrCode: { create: jest.fn().mockResolvedValue(undefined) },
      $transaction: jest.fn(async (input) =>
        typeof input === 'function' ? input(prismaService) : Promise.all(input),
      ),
    };
    const razorpayClientService = {
      keyId: 'rzp_test',
      createOrder: jest.fn().mockResolvedValue({
        id: 'order-id',
        amount: 100000,
        currency: 'INR',
      }),
      createQrCode: jest.fn().mockResolvedValue({
        id: 'qr-id',
        imageUrl: 'https://example.test/qr.png',
        status: 'active',
      }),
    };
    const service = createService({ prismaService, razorpayClientService });

    await service.createCheckoutSession('user-id', checkoutDto);

    const bookingData = prismaService.booking.create.mock.calls[0][0].data;

    expect(bookingData.poojaDate).toEqual(expect.any(Date));
    expect(bookingData.poojaDate.getFullYear()).toBe(2026);
    expect(bookingData.poojaDate.getMonth()).toBe(6);
    expect(bookingData.poojaDate.getDate()).toBe(12);
    expect(bookingData.poojaDate.getHours()).toBe(8);
    expect(bookingData.poojaDate.getMinutes()).toBe(30);
    expect(bookingData.bookingDate).toEqual(new Date(2026, 6, 4, 12, 0, 0));
  });

  it('returns only the signed-in users my poojas with page filters', async () => {
    const prismaService = {
      booking: {
        findMany: jest.fn().mockResolvedValue([booking]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const fileStorageService = {
      createSecureUrl: jest.fn().mockResolvedValue('https://signed.test/img'),
    };
    const service = createService({ prismaService, fileStorageService });

    await expect(
      service.getMyPoojas('user-id', {
        page: 1,
        limit: 10,
        search: 'nava',
        status: BookingStatus.COMPLETED,
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'booking-id',
          bookingNumber: 'YGM-001',
          pooja: {
            id: 'pooja-id',
            name: 'Nava Graha Pooja',
            imageUrls: ['https://signed.test/img'],
          },
          temple: {
            id: 'temple-id',
            name: 'Kottayil Kovilakam Temple',
          },
          devotees: [
            { name: 'Devotee One', naal: 'Aswathi' },
            { name: 'Devotee Two', naal: 'Bharani' },
          ],
          displayType: 'Weekly Plan',
          displayStatus: 'Completed',
          latestPaymentStatus: PaymentStatus.SUCCESS,
          completionNote:
            'Pooja completed. Photos & videos sent on WhatsApp +91 9876543210',
        }),
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    expect(prismaService.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { userId: 'user-id' },
            { status: BookingStatus.COMPLETED },
            expect.objectContaining({ OR: expect.any(Array) }),
          ],
        },
        orderBy: { poojaDate: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
    expect(fileStorageService.createSecureUrl).toHaveBeenCalledWith(
      'poojas/navagraha.jpg',
    );
  });
});
