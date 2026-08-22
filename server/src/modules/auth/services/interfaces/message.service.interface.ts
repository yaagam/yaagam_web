export interface SendOtpMessageRequest {
  whatsappNumber: string;
  otp: string;
}

export interface SendBookingConfirmationRequest {
  whatsappNumber: string;
  imageUrl: string;
  customerName: string;
  bookingId: string;
  poojaName: string;
  templeName: string;
  poojaDate: string;
  poojaTime: string;
}

export interface SendAutopayCutoffReminderRequest {
  whatsappNumber: string;
  amount: string;
  poojaName: string;
  chargeDate: string;
}

export interface IMessageService {
  sendOtpMessage(prop: SendOtpMessageRequest): Promise<void>;
  sendBookingConfirmation(
    request: SendBookingConfirmationRequest,
  ): Promise<void>;
  sendAutopayCutoffReminder(
    request: SendAutopayCutoffReminderRequest,
  ): Promise<void>;
}
