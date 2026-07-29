import type { CreatePaymentDto } from '../dtos/create-payment.dto';
import type { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
export interface PaymentInformation {
  paymentReference: string;
  status: string;
  amount: number;
  currency: string;
  expiresAt: Date;
  qr: { reference: string; imageUrl: string | null };
}
export interface SubscriptionInformation {
  subscriptionReference: string;
  status: string;
  mandateAuthorizationUrl: string | null;
}
export interface IPaymentService {
  createPayment(
    userId: string,
    idempotencyKey: string,
    dto: CreatePaymentDto,
    correlationId?: string,
  ): Promise<PaymentInformation>;
  getPayment(
    userId: string,
    reference: string,
  ): Promise<Record<string, unknown>>;
  cancelPayment(userId: string, reference: string): Promise<void>;
  reconcilePayment(
    userId: string,
    reference: string,
  ): Promise<Record<string, unknown>>;
  createSubscription(
    userId: string,
    idempotencyKey: string,
    dto: CreateSubscriptionDto,
    correlationId?: string,
  ): Promise<SubscriptionInformation>;
  changeSubscription(
    userId: string,
    reference: string,
    action: 'pause' | 'resume' | 'cancel',
  ): Promise<void>;
}
