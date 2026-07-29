import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../prisma/prisma.service';
import type { IBookingLifecycleService } from './booking-lifecycle.service.interface';

const LIFECYCLE_INTERVAL_MS = 60_000;
const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const COMPLETION_HOUR = 12;

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
    const completionBoundary = this._getCompletionBoundary(now);
    const result = await this._prismaService.booking.updateMany({
      where: {
        status: BookingStatus.SCHEDULED,
        poojaDate: { lt: completionBoundary },
      },
      data: { status: BookingStatus.COMPLETED },
    });
    return result.count;
  }

  private _getCompletionBoundary(now: Date): Date {
    const indiaNow = new Date(now.getTime() + INDIA_OFFSET_MS);
    const year = indiaNow.getUTCFullYear();
    const month = indiaNow.getUTCMonth();
    const day = indiaNow.getUTCDate();
    const afterNoon = indiaNow.getUTCHours() >= COMPLETION_HOUR;
    const exclusiveDay = afterNoon ? day + 1 : day;

    return new Date(Date.UTC(year, month, exclusiveDay) - INDIA_OFFSET_MS);
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
