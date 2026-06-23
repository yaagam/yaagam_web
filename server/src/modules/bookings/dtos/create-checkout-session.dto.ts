import {
  IsIn,
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

  @IsOptional()
  @IsString()
  nakshatra?: string;

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

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  poojaId: string;

  @IsIn(['weekly', 'single'])
  plan: 'weekly' | 'single';

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
