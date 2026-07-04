import { ContactMethod } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phoneNumber: string;

  @IsEnum(ContactMethod)
  contactMethod: ContactMethod;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  problem: string;
}
