import {
  ArrayUnique,
  ArrayMaxSize,
  IsArray,
  Equals,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  IsNotEmpty,
  IsObject,
  ArrayMinSize,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  normalizeIndianMobileNumber,
  normalizeWhatsappNumber,
} from '../../../common/utils/phone-number.util';
import { BOOKING_CONSENT_NOTICE_VERSION } from '../../privacy/privacy.constants';

export class CheckoutDevoteeDetailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  naal: string;
}

export class CheckoutDevoteeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CheckoutDevoteeDetailDto)
  devotees: CheckoutDevoteeDetailDto[];

  @IsString()
  @Transform(({ value }) => normalizeWhatsappNumber(value))
  @Matches(/^\+[1-9]\d{7,14}$/)
  whatsappNumber: string;

  @IsString()
  @IsNotEmpty()
  state: string;

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
  @Transform(({ value }) => normalizeIndianMobileNumber(value))
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Address phone number must be a valid Indian mobile number',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class CheckoutOfferingDto {
  @IsString()
  @IsNotEmpty()
  offeringSlug: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @Equals(true)
  devoteeAuthorityConfirmed: true;

  @Equals(BOOKING_CONSENT_NOTICE_VERSION)
  privacyNoticeVersion: string;

  @IsString()
  @IsNotEmpty()
  poojaSlug: string;

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
  offeringSlugs?: string[];

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
