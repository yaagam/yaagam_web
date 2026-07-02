import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { BookingStatus, BookingType, PaymentStatus } from '@prisma/client';

export class GetAdminBookingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(BookingType)
  type?: BookingType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  poojaId?: string;

  @IsOptional()
  @IsString()
  templeId?: string;

  @IsOptional()
  @IsString()
  templeName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  bookingDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  bookingDateTo?: Date;
}
