import { IsOptional, IsString, IsUUID } from 'class-validator';

export class OfferingDetailsRequestDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID()
  id: string;
}
