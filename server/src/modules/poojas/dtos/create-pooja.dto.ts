import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidateNested,
} from 'class-validator';
import { PoojaTranslationDto } from './pooja-translation.dto';
import {
  parseBooleanValue,
  parseStringArray,
  parseTranslations,
} from './pooja-dto.parsers';
@ValidatorConstraint({ name: 'hasValidEnglishPoojaTranslation' })
class HasValidEnglishPoojaTranslation implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return false;

    const english = value.find(
      (translation: unknown) =>
        typeof translation === 'object' &&
        translation !== null &&
        (translation as PoojaTranslationDto).language === 'EN',
    ) as PoojaTranslationDto | undefined;

    return Boolean(
      english &&
      typeof english.name === 'string' &&
      english.name.length >= 2 &&
      typeof english.about === 'string' &&
      english.about.length >= 1 &&
      typeof english.poojaFor === 'string' &&
      english.poojaFor.length >= 1,
    );
  }

  defaultMessage(): string {
    return 'English pooja name, about, and pooja-for text are required';
  }
}

export class CreatePoojaDto {
  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  templeId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  templeAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  baseAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  sellingPrice: number;

  @IsString()
  @IsNotEmpty()
  poojaDay: string;

  @IsString()
  @IsNotEmpty()
  time: string;
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isWeekly: boolean;

  @Type(() => Number)
  @IsIn([2, 3, 4, 5])
  recommendedWeeks: number;

  @Transform(({ value }) => parseStringArray(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  benefitIds: string[];

  @Transform(({ value }) => parseStringArray(value), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offeringIds?: string[];

  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Validate(HasValidEnglishPoojaTranslation)
  translations: PoojaTranslationDto[];
}
