export interface SendOtpMessageRequest {
  whatsappNumber: string;
  otp: string;
}

export interface IMessageService {
  sendOtpMessage(prop: SendOtpMessageRequest): Promise<void>;
}
