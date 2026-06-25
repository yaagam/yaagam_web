import { IsNumberString, IsString, Length } from 'class-validator';

export class VerifyChangeWhatsappOtpDto {
  @IsString()
  sessionId: string;

  @IsNumberString()
  @Length(6, 6)
  otp: string;
}
