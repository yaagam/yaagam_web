export interface ActivatePaidOccurrenceInput {
  transactionId: string;
  paymentAttemptId: string;
  subscriptionId?: string;
}

export interface IBookingPaymentActivationService {
  activatePaidOccurrence(input: ActivatePaidOccurrenceInput): Promise<void>;
}
