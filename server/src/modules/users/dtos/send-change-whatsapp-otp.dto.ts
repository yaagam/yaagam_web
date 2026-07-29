import { Matches } from 'class-validator';
import { INVALID_NUMBER } from '../../auth/constants/errors.const';

export class SendChangeWhatsappOtpDto {
  @Matches(/^[6-9]\d{9}$/, { message: INVALID_NUMBER })
  whatsappNumber: string;
}
