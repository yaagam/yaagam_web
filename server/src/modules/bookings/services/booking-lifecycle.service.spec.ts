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

  it('does not complete the current pooja day before noon in India', async () => {
    const { service, prismaService } = createService();

    await service.completeDueBookings(new Date('2026-07-29T06:29:59.000Z'));

    expect(prismaService.booking.updateMany).toHaveBeenCalledWith({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lt: new Date('2026-07-28T18:30:00.000Z') },
      },
      data: { status: BookingStatus.COMPLETED },
    });
  });

  it('completes the current pooja day from noon in India', async () => {
    const { service, prismaService } = createService(2);

    await expect(
      service.completeDueBookings(new Date('2026-07-29T06:30:00.000Z')),
    ).resolves.toBe(2);

    expect(prismaService.booking.updateMany).toHaveBeenCalledWith({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lt: new Date('2026-07-29T18:30:00.000Z') },
      },
      data: { status: BookingStatus.COMPLETED },
    });
  });
});
