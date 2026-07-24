import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateOpsBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
