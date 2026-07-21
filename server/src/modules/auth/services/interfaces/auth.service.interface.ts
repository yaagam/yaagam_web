import type { AuthRole } from './token.service.interface';

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
  role: AuthRole;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export type RefreshTokenOutput = Omit<VerifyOtpOutput, 'refreshToken'> & {
  refreshToken?: string;
};

export interface LogoutInput {
  refreshToken: string;
}

export interface IAuthService {
  sendOtp(prop: SendOtpInput): Promise<SendOtpOutput>;
  verifyOtp(prop: VerifyOtpInput): Promise<VerifyOtpOutput>;
  refreshToken(prop: RefreshTokenInput): Promise<RefreshTokenOutput>;
  logout(prop: LogoutInput): Promise<void>;
  logoutAllDevices(prop: LogoutInput): Promise<void>;
}
