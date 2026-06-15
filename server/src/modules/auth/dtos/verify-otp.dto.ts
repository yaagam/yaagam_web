import { IsNumberString, Length } from 'class-validator';

export class VerifyOtpRequestDto {
  @IsNumberString()
  @Length(6, 6)
  otp: string;
}
