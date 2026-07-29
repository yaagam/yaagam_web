import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDevoteeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  whatsappNumber: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  naal: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;
}

export class CheckoutAddressDto {
  @IsOptional()
  @IsString()
  houseNo?: string;

  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pincode: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class CheckoutOfferingDto {
  @IsString()
  @IsNotEmpty()
  offeringId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  poojaId: string;

  @IsOptional()
  @IsIn(['weekly', 'single'])
  selectedPlan?: 'weekly' | 'single';

  @IsOptional()
  @IsIn(['weekly', 'single'])
  plan?: 'weekly' | 'single';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutOfferingDto)
  offerings?: CheckoutOfferingDto[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  offeringIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dakshinaAmount?: number;

  @IsOptional()
  @IsString()
  sankalpa?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CheckoutDevoteeDto)
  devotee: CheckoutDevoteeDto;

  @ValidateIf((dto: CreateCheckoutSessionDto) => dto.address !== null)
  @IsObject()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  address: CheckoutAddressDto | null;
}
