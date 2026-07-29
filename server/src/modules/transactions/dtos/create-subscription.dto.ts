import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';
export class CreateSubscriptionDto {
  @ApiProperty() @IsUUID() bookingReference: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ minimum: 2, maximum: 104 })
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(104)
  totalCount: number;
}
