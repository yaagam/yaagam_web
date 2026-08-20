import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PoojaTranslationDto } from './pooja-translation.dto';
import {
  parseBooleanValue,
  parseNumberArray,
  parseStringArray,
  parseTranslations,
} from './pooja-dto.parsers';

export class UpdatePoojaDto {
  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseNumberArray(value), { toClassOnly: true })
  @IsArray()
  @IsInt({ each: true })
  imageSlots?: number[];

  @IsOptional()
  @IsString()
  templeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  templeAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  baseAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  sellingPrice?: number;

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
  @IsIn([2, 3, 4, 5])
  recommendedWeeks?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mantraChantCount?: number;

  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  removeMantraAudio?: boolean;

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
