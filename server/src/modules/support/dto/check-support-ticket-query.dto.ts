import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CheckSupportTicketQueryDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Indian 10-digit mobile number',
  })
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phoneNumber: string;
}
