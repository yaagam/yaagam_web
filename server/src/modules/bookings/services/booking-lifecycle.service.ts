import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import type { IBookingLifecycleService } from './booking-lifecycle.service.interface';

const LIFECYCLE_INTERVAL_MS = 60_000;
const COMPLETION_DELAY_MS = 60 * 60 * 1000;

@Injectable()
export class BookingLifecycleService
  implements IBookingLifecycleService, OnModuleInit, OnModuleDestroy
{
  private _timer?: NodeJS.Timeout;

  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(BookingLifecycleService.name);
  }

  onModuleInit(): void {
    void this._runSafely();
    this._timer = setInterval(
      () => void this._runSafely(),
      LIFECYCLE_INTERVAL_MS,
    );
    this._timer.unref();
  }

  onModuleDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  async completeDueBookings(now = new Date()): Promise<number> {
    const completionBoundary = new Date(now.getTime() - COMPLETION_DELAY_MS);
    const result = await this._prismaService.booking.updateMany({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lte: completionBoundary },
      },
      data: { status: BookingStatus.COMPLETED },
    });
    return result.count;
  }

  private async _runSafely(): Promise<void> {
    try {
      const completed = await this.completeDueBookings();
      if (completed > 0) {
        this._logger.info({ completed }, 'completed due pooja bookings');
      }
    } catch (error: unknown) {
      this._logger.error(
        { err: error },
        'failed to update automatic pooja booking statuses',
      );
    }
  }
}
