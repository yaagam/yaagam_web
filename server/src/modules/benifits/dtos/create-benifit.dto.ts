import { plainToInstance, Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { BenifitTranslationDto } from './benifit-translation.dto';

const parseTranslations = (
  value: unknown,
): BenifitTranslationDto[] | unknown => {
  let parsedValue: unknown = value;

  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return Array.isArray(parsedValue)
    ? plainToInstance(BenifitTranslationDto, parsedValue)
    : parsedValue;
};

export class CreateBenifitDto {
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  translations: BenifitTranslationDto[];
}
