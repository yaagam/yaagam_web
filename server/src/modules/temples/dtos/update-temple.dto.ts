import { plainToInstance, Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TempleTranslationDto } from './temple-translation.dto';

const parseTranslations = (value: unknown): TempleTranslationDto[] | unknown => {
  let parsedValue: unknown = value;

  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return Array.isArray(parsedValue)
    ? plainToInstance(TempleTranslationDto, parsedValue)
    : parsedValue;
};

export class UpdateTempleDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ValidateNested({ each: true })
  translations?: TempleTranslationDto[];
}
