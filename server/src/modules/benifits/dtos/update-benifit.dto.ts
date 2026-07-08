import { plainToInstance, Transform } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { BenifitTranslationDto } from './benifit-translation.dto';

const parseTranslations = (value: unknown): unknown => {
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

export class UpdateBenifitDto {
  @IsOptional()
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ValidateNested({ each: true })
  translations?: BenifitTranslationDto[];
}
