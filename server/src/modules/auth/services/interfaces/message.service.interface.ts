export interface SendOtpMessageRequest {
  whatsappNumber: string;
  otp: string;
}

export interface SendBookingConfirmationRequest {
  whatsappNumber: string;
  customerName: string;
  bookingId: string;
  poojaName: string;
  templeName: string;
  poojaDate: string;
  amountPaid: string;
}

export interface IMessageService {
  sendOtpMessage(prop: SendOtpMessageRequest): Promise<void>;
  sendBookingConfirmation(
    request: SendBookingConfirmationRequest,
  ): Promise<void>;
}
