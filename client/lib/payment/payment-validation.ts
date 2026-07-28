import type { PaymentSnapshot, PaymentStatus } from "@/types/payment";

const statuses = new Set<PaymentStatus>([
  "loading", "pending", "processing", "success", "failed", "expired",
  "cancelled", "retrying", "subscription_active", "subscription_pending",
  "subscription_cancelled",
]);

const text = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function parsePaymentSnapshot(value: unknown): PaymentSnapshot {
  const body =
    value && typeof value === "object" && "data" in value
      ? (value as { data?: unknown }).data
      : value;
  if (!body || typeof body !== "object") throw new Error("invalid_response");

  const record = body as Record<string, unknown>;
  const status = text(record.status, 40) as PaymentStatus;
  const expiresAt = text(record.expiresAt, 64);
  const serverTime = text(record.serverTime, 64);

  if (!statuses.has(status) || !expiresAt || !serverTime) {
    throw new Error("invalid_response");
  }
  if (!Number.isFinite(Date.parse(expiresAt)) || !Number.isFinite(Date.parse(serverTime))) {
    throw new Error("invalid_response");
  }

  return {
    status,
    expiresAt,
    serverTime,
    qrPayload: text(record.qrPayload, 4096) || undefined,
    qrImageUrl: text(record.qrImageUrl, 2048) || undefined,
    correlationId: text(record.correlationId, 128) || undefined,
    redirectUrl: text(record.redirectUrl, 2048) || undefined,
    message: text(record.message) || undefined,
  };
}
