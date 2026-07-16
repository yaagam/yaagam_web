import { Language } from '@prisma/client';
import { plainToInstance, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TempleTranslationDto } from './temple-translation.dto';

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
    ? plainToInstance(TempleTranslationDto, parsedValue)
    : parsedValue;
};

const hasTranslations = (dto: CreateTempleDto): boolean =>
  Array.isArray(dto.translations) && dto.translations.length > 0;

export class CreateTempleDto {
  @IsEmail()
  email: string;

  @IsString()
  state: string;

  @IsString()
  description: string;

  @ValidateIf((dto: CreateTempleDto) => !hasTranslations(dto))
  @IsString()
  name?: string;

  @ValidateIf((dto: CreateTempleDto) => !hasTranslations(dto))
  @IsString()
  district?: string;

  @ValidateIf((dto: CreateTempleDto) => !hasTranslations(dto))
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ValidateIf(
    (dto: CreateTempleDto) => !dto.name && !dto.district && !dto.place,
  )
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  translations?: TempleTranslationDto[];
}
