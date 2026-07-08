import { SupportStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSupportTicketStatusDto {
  @IsEnum(SupportStatus)
  status: SupportStatus;
}
