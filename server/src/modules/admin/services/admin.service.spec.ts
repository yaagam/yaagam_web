import {
  AuthProvider,
  BookingStatus,
  BookingType,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  function createService(
    prismaService: Record<string, unknown>,
    supportTicketRepository = {
      findManyForAdmin: jest.fn(),
      updateStatus: jest.fn(),
    },
    supportTicketCleanupService = {
      scheduleResolvedTicketDeletion: jest.fn(),
    },
  ) {
    return {
      service: new AdminService(
        prismaService as never,
        supportTicketRepository as never,
        supportTicketCleanupService as never,
      ),
      supportTicketCleanupService,
    };
  }

  it('returns paginated users with search and filters', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-id',
            whatsappNumber: '9876543210',
            isWhatsappVerified: true,
            provider: AuthProvider.WHATSAPP,
            role: UserRole.USER,
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-02T00:00:00.000Z'),
            _count: {
              bookings: 2,
              addresses: 1,
            },
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const { service } = createService(prismaService);

    await expect(
      service.getUsers({
        page: 1,
        limit: 10,
        search: '9876',
        role: UserRole.USER,
        provider: AuthProvider.WHATSAPP,
        isWhatsappVerified: true,
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'user-id',
          bookingsCount: 2,
          addressesCount: 1,
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

    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({ OR: expect.any(Array) }),
            { role: UserRole.USER },
            { provider: AuthProvider.WHATSAPP },
            { isWhatsappVerified: true },
          ],
        },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('returns deleted pooja bookings from snapshot data', async () => {
    const prismaService = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'booking-id',
            bookingNumber: 'YGM-001',
            user: {
              id: 'user-id',
              whatsappNumber: '9876543210',
              isWhatsappVerified: true,
            },
            poojaId: null,
            pooja: null,
            templeId: 'temple-id',
            temple: {
              translations: [{ language: 'EN', name: 'Temple Name' }],
            },
            poojaSnapshot: {
              id: 'deleted-pooja-id',
              translations: [{ language: 'EN', name: 'Deleted Pooja' }],
            },
            templeSnapshot: {},
            bookingWhatsappNumber: '9876543210',
            type: BookingType.SINGLE,
            status: BookingStatus.CONFIRMED,
            bookingDate: new Date('2026-06-29T00:00:00.000Z'),
            baseAmount: 601,
            discountAmount: 100,
            finalAmount: 501,
            transactions: [],
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-02T00:00:00.000Z'),
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const { service } = createService(prismaService);

    await expect(service.getBookings({ page: 1, limit: 10 })).resolves.toEqual({
      items: [
        expect.objectContaining({
          pooja: { id: 'deleted-pooja-id', name: 'Deleted Pooja' },
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
  });
  it('returns paginated bookings with search and filters', async () => {
    const prismaService = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'booking-id',
            bookingNumber: 'YGM-001',
            user: {
              id: 'user-id',
              whatsappNumber: '9876543210',
              isWhatsappVerified: true,
            },
            poojaId: 'pooja-id',
            pooja: {
              translations: [{ language: 'EN', name: 'Nava Graha Pooja' }],
            },
            templeId: 'temple-id',
            temple: {
              translations: [{ language: 'EN', name: 'Temple Name' }],
            },
            poojaSnapshot: {},
            templeSnapshot: {},
            bookingWhatsappNumber: '9876543210',
            type: BookingType.SINGLE,
            status: BookingStatus.CONFIRMED,
            bookingDate: new Date('2026-06-29T00:00:00.000Z'),
            baseAmount: 601,
            discountAmount: 100,
            finalAmount: 501,
            transactions: [{ status: PaymentStatus.SUCCESS }],
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-02T00:00:00.000Z'),
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const { service } = createService(prismaService);

    await expect(
      service.getBookings({
        page: 1,
        limit: 10,
        search: 'nava',
        status: BookingStatus.CONFIRMED,
        type: BookingType.SINGLE,
        paymentStatus: PaymentStatus.SUCCESS,
        userId: 'user-id',
        poojaId: 'pooja-id',
        templeId: 'temple-id',
        templeName: 'Temple',
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'booking-id',
          pooja: { id: 'pooja-id', name: 'Nava Graha Pooja' },
          temple: { id: 'temple-id', name: 'Temple Name' },
          latestPaymentStatus: PaymentStatus.SUCCESS,
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
            expect.objectContaining({ OR: expect.any(Array) }),
            { status: BookingStatus.CONFIRMED },
            { type: BookingType.SINGLE },
            { transactions: { some: { status: PaymentStatus.SUCCESS } } },
            { userId: 'user-id' },
            { poojaId: 'pooja-id' },
            { templeId: 'temple-id' },
            {
              temple: {
                translations: {
                  some: {
                    name: { contains: 'Temple', mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        },
        skip: 0,
        take: 10,
      }),
    );
  });
  it('returns paginated support tickets from the support repository', async () => {
    const supportTicketRepository = {
      findManyForAdmin: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'ticket-id',
            ticketNumber: 'SUP-000001',
            userId: null,
            name: 'Devotee',
            phoneNumber: '9876543210',
            contactMethod: 'WHATSAPP',
            problem: 'Need help with my booking',
            status: 'OPEN',
            createdAt: new Date('2026-07-04T00:00:00.000Z'),
            updatedAt: new Date('2026-07-04T00:00:00.000Z'),
            resolvedAt: null,
            resolvedBy: null,
          },
        ],
        total: 1,
      }),
      updateStatus: jest.fn(),
    };
    const { service } = createService({}, supportTicketRepository);
    const query = {
      page: 1,
      limit: 10,
      status: 'OPEN' as never,
      search: 'SUP',
    };

    await expect(service.getSupportTickets(query)).resolves.toEqual({
      items: [expect.objectContaining({ ticketNumber: 'SUP-000001' })],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    expect(supportTicketRepository.findManyForAdmin).toHaveBeenCalledWith(
      query,
    );
  });

  it('updates support ticket status through the support repository', async () => {
    const supportTicketRepository = {
      findManyForAdmin: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue({
        id: 'ticket-id',
        ticketNumber: 'SUP-000001',
        status: 'RESOLVED',
        resolvedAt: new Date('2026-07-04T00:00:00.000Z'),
        resolvedBy: 'admin-id',
      }),
    };
    const { service, supportTicketCleanupService } = createService(
      {},
      supportTicketRepository,
    );
    const dto = { status: 'RESOLVED' as never };

    await expect(
      service.updateSupportTicketStatus('ticket-id', dto, 'admin-id'),
    ).resolves.toEqual({
      id: 'ticket-id',
      ticketNumber: 'SUP-000001',
      status: 'RESOLVED',
      resolvedAt: new Date('2026-07-04T00:00:00.000Z'),
      resolvedBy: 'admin-id',
    });
    expect(supportTicketRepository.updateStatus).toHaveBeenCalledWith(
      'ticket-id',
      'RESOLVED',
      'admin-id',
    );
    expect(
      supportTicketCleanupService.scheduleResolvedTicketDeletion,
    ).toHaveBeenCalledWith('ticket-id', new Date('2026-07-04T00:00:00.000Z'));
  });
});
