import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { OfferingTranslationDto } from './offering-translation.dto';
import {
  parseBooleanValue,
  parseOfferingTranslations,
} from './offering-dto.parsers';
import { DiscountPriceValidator } from '../validators/discount-price.validator';

export class CreateOfferingDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  templeAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  actualPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Validate(DiscountPriceValidator)
  discountPrice: number;

  @Transform(({ value }) => parseBooleanValue(value), { toClassOnly: true })
  @IsBoolean()
  isActive: boolean;

  @Transform(({ value }) => parseOfferingTranslations(value), {
    toClassOnly: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  translations: OfferingTranslationDto[];
}
