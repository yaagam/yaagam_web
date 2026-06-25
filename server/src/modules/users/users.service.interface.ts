import type { SendChangeWhatsappOtpDto } from './dtos/send-change-whatsapp-otp.dto';
import type { VerifyChangeWhatsappOtpDto } from './dtos/verify-change-whatsapp-otp.dto';

export interface ChangeWhatsappOtpSession {
  sessionId: string;
}

export interface ChangedWhatsappNumber {
  userId: string;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
}

export interface IUserService {
  getUsers(): Promise<unknown[]>;
  sendChangeWhatsappOtp(
    userId: string,
    dto: SendChangeWhatsappOtpDto,
  ): Promise<ChangeWhatsappOtpSession>;
  verifyChangeWhatsappOtp(
    userId: string,
    dto: VerifyChangeWhatsappOtpDto,
  ): Promise<ChangedWhatsappNumber>;
}
