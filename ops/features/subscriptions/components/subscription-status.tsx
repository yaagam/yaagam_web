import type { Subscription } from "@/types/ops";

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE" || normalized === "AUTHENTICATED")
    return {
      backgroundColor: "#d1fae5",
      borderColor: "#a7f3d0",
      color: "#065f46",
    };
  if (normalized === "PAUSED" || normalized === "HALTED")
    return {
      backgroundColor: "#fef3c7",
      borderColor: "#fde68a",
      color: "#92400e",
    };
  if (["FAILED", "EXPIRED", "CANCELLED"].includes(normalized))
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#fecaca",
      color: "#991b1b",
    };
  if (normalized === "COMPLETED")
    return {
      backgroundColor: "#dbeafe",
      borderColor: "#bfdbfe",
      color: "#1e40af",
    };
  if (normalized === "CREATING" || normalized === "CREATED")
    return {
      backgroundColor: "#ede9fe",
      borderColor: "#ddd6fe",
      color: "#5b21b6",
    };
  return {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    color: "#475569",
  };
}

export function SubscriptionStatusView({
  subscription,
  detailed = false,
}: {
  subscription: Subscription;
  detailed?: boolean;
}) {
  const current = subscription.providerStatus ?? subscription.status;
  const webhookDiffers =
    Boolean(subscription.providerStatus) &&
    subscription.providerStatus?.toUpperCase() !== subscription.status;

  return (
    <div>
      <span
        className="inline-flex rounded-md border px-2 py-1 text-xs font-semibold"
        style={statusStyle(current)}
      >
        {current.toUpperCase()}
      </span>
      {detailed && (
        <>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">UPI AutoPay:</span>{" "}
            <span className="font-medium">
              {subscription.autopayMandateStatus}
            </span>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Local webhook:</span>{" "}
            <span className="font-medium">{subscription.status}</span>
          </p>
          {webhookDiffers && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Razorpay and the latest webhook are temporarily out of sync.
            </p>
          )}
        </>
      )}
    </div>
  );
}
