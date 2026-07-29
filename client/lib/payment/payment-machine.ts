import type { PaymentStatus } from "@/types/payment";

const transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  loading: ["pending", "processing", "success", "failed", "expired", "cancelled", "subscription_pending", "subscription_active", "subscription_cancelled"],
  pending: ["processing", "success", "failed", "expired", "cancelled", "retrying", "subscription_pending", "subscription_active"],
  processing: ["pending", "success", "failed", "expired", "cancelled", "subscription_pending", "subscription_active"],
  success: [],
  failed: ["retrying"],
  expired: ["retrying"],
  cancelled: ["retrying"],
  retrying: ["pending", "processing", "failed", "expired", "subscription_pending"],
  subscription_active: [],
  subscription_pending: ["subscription_active", "subscription_cancelled", "failed", "expired", "cancelled"],
  subscription_cancelled: ["retrying"],
};

export const terminalPaymentStatuses = new Set<PaymentStatus>([
  "success",
  "subscription_active",
  "subscription_cancelled",
]);

export function canTransition(from: PaymentStatus, to: PaymentStatus) {
  return from === to || transitions[from].includes(to);
}
