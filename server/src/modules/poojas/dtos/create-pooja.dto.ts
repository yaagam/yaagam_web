import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
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

export class CreatePoojaDto {
  @IsString()
  templeId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @IsString()
  poojaDay: string;

  @IsString()
  time: string;
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isWeekly: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  weeklyDiscount: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  normalDiscount: number;

  @Transform(({ value }) => parseStringArray(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  benefitIds: string[];

  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  translations: PoojaTranslationDto[];
}
