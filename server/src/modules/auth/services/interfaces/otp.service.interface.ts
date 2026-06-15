export interface GenerateOtpRequest {
  userId: string;
}

export interface GenerateOtpResponse {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpResponse {
  userId: string;
}

export interface ResendOtpRequest {
  sessionId: string;
}

export interface ResendOtpResponse {
  userId: string;
  otp: string;
}

export interface IOtpService {
  generate(prop: GenerateOtpRequest): Promise<GenerateOtpResponse>;
  verify(prop: VerifyOtpRequest): Promise<VerifyOtpResponse>;
  resend(prop: ResendOtpRequest): Promise<ResendOtpResponse>;
}
