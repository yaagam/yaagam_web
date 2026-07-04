import { SupportStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateSupportTicketStatusDto {
  @IsEnum(SupportStatus)
  status: SupportStatus;
}
