import { IsString, IsUUID, ValidateIf } from 'class-validator';

export class PoojaDetailsRequestDto {
  @ValidateIf((value: PoojaDetailsRequestDto) => !value.id)
  @IsString()
  slug?: string;

  @ValidateIf((value: PoojaDetailsRequestDto) => !value.slug)
  @IsUUID()
  id?: string;
}
