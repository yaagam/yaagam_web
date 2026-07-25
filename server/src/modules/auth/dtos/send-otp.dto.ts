import { Matches } from 'class-validator';
import { INVALID_NUMBER } from '../constants/errors.const';

export class SendOtpRequestDto {
  @Matches(/^[6-9]\d{9}$/, { message: INVALID_NUMBER })
  whatsappNumber: string;
}
