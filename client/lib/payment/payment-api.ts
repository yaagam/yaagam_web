import axios from "axios";

import apiClient from "@/lib/api/axios/axios.instance";
import { parsePaymentSnapshot } from "@/lib/payment/payment-validation";
import type { PaymentError, PaymentSnapshot } from "@/types/payment";

const pendingStatusRequests = new Map<string, Promise<PaymentSnapshot>>();

function headers(correlationId?: string, idempotencyKey?: string) {
  return {
    ...(correlationId ? { "X-Correlation-ID": correlationId } : {}),
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

export function toPaymentError(error: unknown): PaymentError {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { code: "offline", message: "You’re offline. We’ll resume checking when you reconnect.", retryable: true };
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return {
      code: status ? "server" : "network",
      message: status && status >= 500
        ? "The payment service is temporarily unavailable. Your payment is safe."
        : "We couldn’t verify the payment yet. We’ll keep trying.",
      retryable: !status || status >= 500 || status === 429,
    };
  }
  if (error instanceof Error && error.message === "invalid_response") {
    return { code: "invalid_response", message: "The payment service returned an unexpected response.", retryable: true };
  }
  return { code: "unknown", message: "Something unexpected happened. Please try again.", retryable: true };
}

function sessionPath(publicToken: string) {
  return `/payments/sessions/${encodeURIComponent(publicToken)}`;
}

export function getPaymentStatus(
  publicToken: string,
  correlationId?: string,
  signal?: AbortSignal,
) {
  const existing = pendingStatusRequests.get(publicToken);
  if (existing) return existing;

  const request = apiClient
    .get(sessionPath(publicToken), { signal, headers: headers(correlationId) })
    .then((response) => parsePaymentSnapshot(response.data))
    .finally(() => pendingStatusRequests.delete(publicToken));
  pendingStatusRequests.set(publicToken, request);
  return request;
}

export async function cancelPayment(publicToken: string, correlationId?: string) {
  const response = await apiClient.post(
    `${sessionPath(publicToken)}/cancel`,
    {},
    { headers: headers(correlationId, crypto.randomUUID()) },
  );
  return parsePaymentSnapshot(response.data);
}

export async function retryPayment(publicToken: string, correlationId?: string) {
  const response = await apiClient.post(
    `${sessionPath(publicToken)}/retry`,
    {},
    { headers: headers(correlationId, crypto.randomUUID()) },
  );
  return parsePaymentSnapshot(response.data);
}
