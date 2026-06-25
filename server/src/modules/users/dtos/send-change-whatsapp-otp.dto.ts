import { IsNumberString, Length } from 'class-validator';
import { INVALID_NUMBER } from '../../auth/constants/errors.const';

export class SendChangeWhatsappOtpDto {
  @IsNumberString({}, { message: INVALID_NUMBER })
  @Length(10, 10, { message: INVALID_NUMBER })
  whatsappNumber: string;
}
