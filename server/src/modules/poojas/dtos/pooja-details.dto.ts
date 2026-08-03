import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PoojaDetailsRequestDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID()
  id: string;
}
