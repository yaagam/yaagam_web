import { BookingStatus, BookingType, PaymentStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
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
    devoteeSnapshot: {},
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
    status: BookingStatus.COMPLETED,
    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    transactions: [{ status: PaymentStatus.SUCCESS }],
  };

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
        orderBy: { bookingDate: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
    expect(fileStorageService.createSecureUrl).toHaveBeenCalledWith(
      'poojas/navagraha.jpg',
    );
  });
});
