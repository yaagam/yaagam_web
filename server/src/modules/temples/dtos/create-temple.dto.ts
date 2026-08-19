import { Language } from '@prisma/client';
import { plainToInstance, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsDefined,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TempleTranslationDto } from './temple-translation.dto';
import { TemplePriestDto, parseTemplePriest } from './temple-priest.dto';
import { parseBooleanValue } from '../../../common/utils/transform.util';

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

@ValidatorConstraint({ name: 'hasValidEnglishTempleTranslation' })
class HasValidEnglishTempleTranslation implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return false;

    const english = value.find(
      (translation: unknown) =>
        typeof translation === 'object' &&
        translation !== null &&
        (translation as TempleTranslationDto).language === Language.EN,
    ) as TempleTranslationDto | undefined;

    return Boolean(
      english &&
      typeof english.name === 'string' &&
      english.name.length >= 2 &&
      typeof english.district === 'string' &&
      english.district.length >= 1 &&
      typeof english.place === 'string' &&
      english.place.length >= 1 &&
      typeof english.description === 'string' &&
      english.description.length >= 1,
    );
  }

  defaultMessage(): string {
    return 'English temple name, district, place, and description are required';
  }
}

export class CreateTempleDto {
  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;

  @IsDefined()
  @Transform(({ value }) => parseTemplePriest(value), { toClassOnly: true })
  @ValidateNested()
  templePriest: TemplePriestDto;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  state: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @Validate(HasValidEnglishTempleTranslation)
  translations?: TempleTranslationDto[];
}
