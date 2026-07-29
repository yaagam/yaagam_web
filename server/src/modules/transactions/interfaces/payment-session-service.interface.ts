export type ClientPaymentStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'subscription_pending'
  | 'subscription_active'
  | 'subscription_cancelled';

export interface PaymentSessionSnapshot {
  status: ClientPaymentStatus;
  expiresAt: string;
  serverTime: string;
  qrImageUrl?: string;
}

export interface IPaymentSessionService {
  getSnapshot(
    userId: string,
    publicToken: string,
  ): Promise<PaymentSessionSnapshot>;
}
