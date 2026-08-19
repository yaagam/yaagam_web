import { plainToInstance, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
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

export class UpdateTempleDto {
  @IsOptional()
  @Transform(({ value }) => parseTemplePriest(value), { toClassOnly: true })
  @ValidateNested()
  templePriest?: TemplePriestDto;

  @IsOptional()
  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => parseTranslations(value), { toClassOnly: true })
  @IsArray()
  @ValidateNested({ each: true })
  translations?: TempleTranslationDto[];
}
