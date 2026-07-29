export interface IWebhookReceipt {
  duplicate: boolean;
  eventReference: string;
}
export interface IPaymentWebhookService {
  receive(
    rawBody: Buffer,
    signature: string,
    eventId: string,
  ): Promise<IWebhookReceipt>;
  process(eventId: string): Promise<void>;
}
