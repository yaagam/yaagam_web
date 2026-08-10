import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizeWhatsappNumber } from '../../../common/utils/phone-number.util';
import { INVALID_NUMBER } from '../constants/errors.const';

export class SendOtpRequestDto {
  @Transform(({ value }) => normalizeWhatsappNumber(value))
  @Matches(/^\+[1-9]\d{7,14}$/, { message: INVALID_NUMBER })
  whatsappNumber: string;
}
