import type { AuthRole } from './token.service.interface';

export interface AuthRequestContext {
  ipAddress?: string;
}

export interface SendOtpInput extends AuthRequestContext {
  whatsappNumber: string;
}

export interface SendOtpOutput {
  sessionId: string;
}

export interface VerifyOtpInput extends AuthRequestContext {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpOutput {
  userId: string;
  whatsappNumber: string;
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
  sendOtp(input: SendOtpInput): Promise<SendOtpOutput>;
  verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput>;
  refreshToken(input: RefreshTokenInput): Promise<RefreshTokenOutput>;
  logout(input: LogoutInput): Promise<void>;
  logoutAllDevices(input: LogoutInput): Promise<void>;
}
