import { IsNumberString, Length } from 'class-validator';
import { INVALID_NUMBER } from '../constants/messages.const';

export class SendOtpDto {
  @IsNumberString({}, { message: INVALID_NUMBER })
  @Length(10, 10, { message: INVALID_NUMBER })
  whatsappNumber: string;
}
