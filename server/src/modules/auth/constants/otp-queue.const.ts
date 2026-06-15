export const OTP_QUEUE = 'otp';
export const SEND_OTP_JOB = 'send-whatsapp-otp';

export interface SendOtpJobData {
  whatsappNumber: string;
  otp: string;
}
