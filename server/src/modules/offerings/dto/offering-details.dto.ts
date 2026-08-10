import { IsString, IsUUID, ValidateIf } from 'class-validator';

export class OfferingDetailsRequestDto {
  @ValidateIf((value: OfferingDetailsRequestDto) => !value.id)
  @IsString()
  slug?: string;

  @ValidateIf((value: OfferingDetailsRequestDto) => !value.slug)
  @IsUUID()
  id?: string;
}
