export interface SendOtpInput {
  whatsappNumber: string;
}

export interface SendOtpOutput {
  sessionId: string;
}

export interface VerifyOtpInput {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpOutput {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  sendOtp(prop: SendOtpInput): Promise<SendOtpOutput>;
  verifyOtp(prop: VerifyOtpInput): Promise<VerifyOtpOutput>;
}
