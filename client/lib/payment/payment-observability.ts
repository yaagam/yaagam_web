export type PaymentEvent =
  | "payment_started"
  | "qr_displayed"
  | "payment_retry"
  | "payment_cancelled"
  | "payment_success"
  | "payment_failure"
  | "payment_timeout"
  | "subscription_activation";

export function trackPaymentEvent(
  name: PaymentEvent,
  correlationId?: string,
  detail?: Record<string, string | number | boolean>,
) {
  window.dispatchEvent(
    new CustomEvent("yaagam:payment", {
      detail: { name, correlationId, ...detail },
    }),
  );
}
