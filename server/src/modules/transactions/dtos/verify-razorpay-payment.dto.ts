import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyRazorpayPaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingReference: string;

  @IsString()
  @IsNotEmpty()
  transactionReference: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsOptional()
  @IsString()
  razorpay_order_id?: string;

  @IsOptional()
  @IsString()
  razorpay_subscription_id?: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;
}
