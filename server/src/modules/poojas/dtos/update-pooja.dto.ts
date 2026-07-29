import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PoojaTranslationDto } from './pooja-translation.dto';
import {
  parseBooleanValue,
  parseStringArray,
  parseTranslations,
} from './pooja-dto.parsers';

export class UpdatePoojaDto {
  @IsOptional()
  @IsString()
  templeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseAmount?: number;

  @IsOptional()
  @IsString()
  poojaDay?: string;

  @IsOptional()
  @IsString()
  time?: string;
  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isWeekly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weeklyDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  normalDiscount?: number;

  @IsOptional()
  @Transform(({ value }) => parseStringArray(value), { toClassOnly: true })
  @IsArray()
  @IsString({ each: true })
  benefitIds?: string[];

  @IsOptional()
  @Transform(({ value }) => parseStringArray(value), { toClassOnly: true })
  @IsArray()
  @IsString({ each: true })
  offeringIds?: string[];

  @IsOptional()
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ValidateNested({ each: true })
  translations?: PoojaTranslationDto[];
}
