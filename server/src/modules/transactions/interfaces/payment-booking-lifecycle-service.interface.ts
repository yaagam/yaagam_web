export interface MarkOrderPaidInput {
  orderId: string;
  transactionId: string;
  attemptId: string;
  providerPaymentId: string;
}

export interface IPaymentBookingLifecycleService {
  markFailed(transactionId: string): Promise<boolean>;
  markCheckoutCreationFailed(
    transactionId: string,
    orderId?: string,
  ): Promise<void>;
  expireOrder(
    orderId: string,
    transactionId: string,
    now: Date,
  ): Promise<boolean>;
  expireSubscription(
    subscriptionId: string,
    transactionId: string,
  ): Promise<boolean>;
  cancelOrder(orderId: string, transactionId: string): Promise<boolean>;
  markOrderPaid(input: MarkOrderPaidInput): Promise<boolean>;
}
