export interface SendOtpInput {
  whatsappNumber: string;
}

export interface SendOtpOutput {
  sessionId: string;
}

export interface IAuthService {
  sendOtp(prop: SendOtpInput): Promise<SendOtpOutput>;
}
