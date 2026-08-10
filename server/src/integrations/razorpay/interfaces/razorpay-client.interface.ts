import type { IPaymentProvider } from '../../../modules/transactions/interfaces/payment-provider.interface';

export interface IRazorpayClient extends IPaymentProvider {
  readonly keyId: string;
  verifySignature(input: {
    orderId?: string;
    paymentId: string;
    subscriptionId?: string;
    signature: string;
  }): boolean;
}
