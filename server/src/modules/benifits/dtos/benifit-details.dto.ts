import { IsString, IsUUID, ValidateIf } from 'class-validator';

export class BenifitDetailsRequestDto {
  @ValidateIf((value: BenifitDetailsRequestDto) => !value.id)
  @IsString()
  slug?: string;

  @ValidateIf((value: BenifitDetailsRequestDto) => !value.slug)
  @IsUUID()
  id?: string;
}
