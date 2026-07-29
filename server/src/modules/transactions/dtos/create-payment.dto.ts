import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
export class CreatePaymentDto {
  @ApiProperty() @IsUUID() bookingReference: string;
  @ApiProperty() @IsString() description: string;
}
