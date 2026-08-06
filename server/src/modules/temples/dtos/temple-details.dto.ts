import { IsString, IsUUID, ValidateIf } from 'class-validator';

export class TempleDetailsRequestDto {
  @ValidateIf((value: TempleDetailsRequestDto) => !value.id)
  @IsString()
  slug?: string;

  @ValidateIf((value: TempleDetailsRequestDto) => !value.slug)
  @IsUUID()
  id?: string;
}
