import { BookingStatus } from '@prisma/client';
import { BookingLifecycleService } from './booking-lifecycle.service';

describe('BookingLifecycleService', () => {
  function createService(count = 0) {
    const prismaService = {
      booking: { updateMany: jest.fn().mockResolvedValue({ count }) },
    };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    return {
      service: new BookingLifecycleService(
        prismaService as never,
        logger as never,
      ),
      prismaService,
    };
  }

  it('completes scheduled bookings one hour after their pooja time', async () => {
    const { service, prismaService } = createService(2);
    const now = new Date('2026-07-29T06:30:00.000Z');

    await expect(service.completeDueBookings(now)).resolves.toBe(2);

    expect(prismaService.booking.updateMany).toHaveBeenCalledWith({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lte: new Date('2026-07-29T05:30:00.000Z') },
      },
      data: { status: BookingStatus.COMPLETED },
    });
  });

  it('does not include a booking until the full hour has elapsed', async () => {
    const { service, prismaService } = createService();
    const now = new Date('2026-07-29T06:29:59.999Z');

    await service.completeDueBookings(now);

    expect(prismaService.booking.updateMany).toHaveBeenCalledWith({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lte: new Date('2026-07-29T05:29:59.999Z') },
      },
      data: { status: BookingStatus.COMPLETED },
    });
  });
});
