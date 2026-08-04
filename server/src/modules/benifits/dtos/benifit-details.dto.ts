import { IsOptional, IsString, IsUUID } from 'class-validator';

export class BenifitDetailsRequestDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID()
  id: string;
}
