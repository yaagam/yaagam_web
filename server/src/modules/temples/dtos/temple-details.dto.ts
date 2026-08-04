import { IsOptional, IsString, IsUUID } from 'class-validator';

export class TempleDetailsRequestDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID()
  id: string;
}
