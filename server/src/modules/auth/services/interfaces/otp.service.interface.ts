export interface OtpRequestContext {
  ipAddress: string;
}

export interface GenerateOtpRequest extends OtpRequestContext {
  userId: string;
  rateLimitId?: string;
}

export interface GenerateOtpResponse {
  sessionId: string;
  otp: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyOtpRequest extends OtpRequestContext {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpResponse {
  userId: string;
}

export interface IOtpService {
  generate(input: GenerateOtpRequest): Promise<GenerateOtpResponse>;
  verify(input: VerifyOtpRequest): Promise<VerifyOtpResponse>;
  invalidate(sessionId: string): Promise<void>;
}
