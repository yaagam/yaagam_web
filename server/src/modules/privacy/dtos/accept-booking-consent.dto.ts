import { Equals, IsIn, IsString } from 'class-validator';

export class AcceptBookingConsentDto {
  @Equals(true)
  accepted: true;

  @IsString()
  noticeVersion: string;

  @IsString()
  @IsIn(['en', 'hi', 'ml', 'mr', 'ta'])
  language: string;
}
