import { IsOptional, IsString } from 'class-validator';

export class SaveAddressDto {
  @IsOptional()
  @IsString()
  houseNo?: string;

  @IsString()
  streetName: string;

  @IsString()
  pincode: string;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  location?: string;
}
