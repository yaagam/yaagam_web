"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, Pause, Play, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionStatusView } from "@/features/subscriptions/components/subscription-status";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  changeSubscription,
  getSubscription,
  type SubscriptionAction,
} from "@/services/ops.service";
import type { Subscription } from "@/types/ops";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export function SubscriptionDetails({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<SubscriptionAction | null>(
    null,
  );
  const query = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => getSubscription(id),
  });
  const mutation = useMutation({
    mutationFn: (action: SubscriptionAction) => changeSubscription(id, action),
    onSuccess: async () => {
      setPendingAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscription", id] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
      ]);
    },
  });
  const subscription = query.data;

  if (query.isLoading)
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading subscription
        </CardContent>
      </Card>
    );
  if (query.error || !subscription)
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Unable to load this subscription.
        </CardContent>
      </Card>
    );

  const canPause = ["ACTIVE", "AUTHENTICATED"].includes(subscription.status);
  const canResume = subscription.status === "PAUSED";
  const canCancel = !["CANCELLED", "COMPLETED", "EXPIRED"].includes(
    subscription.status,
  );

  return (
    <>
      <div className="mb-4">
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to subscriptions
        </Link>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{subscription.reference}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription.providerSubscriptionId ?? "Razorpay ID pending"}
            </p>
          </div>
          <SubscriptionStatusView subscription={subscription} detailed />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 rounded-lg border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Customer"
              value={subscription.customer.whatsappNumber ?? "-"}
            />
            <Detail label="Pooja" value={subscription.pooja.name} />
            <Detail label="Temple" value={subscription.temple.name} />
            <Detail
              label="Weekly amount"
              value={formatCurrency(subscription.amount)}
            />
            <Detail
              label="Paid cycles"
              value={`${subscription.paidCount} / ${subscription.totalCount ?? ""}`}
            />
            <Detail
              label="Bookings generated"
              value={subscription.bookingsCount}
            />
            <Detail
              label="Next charge"
              value={
                subscription.nextChargeAt
                  ? formatDate(subscription.nextChargeAt)
                  : "-"
              }
            />
            <Detail
              label="Created"
              value={formatDate(subscription.createdAt)}
            />
          </div>
          <div className="grid gap-5 rounded-lg border border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Latest payment status"
              value={subscription.latestPayment?.status ?? "No payment"}
            />
            <Detail
              label="Latest amount"
              value={
                subscription.latestPayment
                  ? formatCurrency(subscription.latestPayment.amount)
                  : "-"
              }
            />
            <Detail
              label="Captured on"
              value={
                subscription.latestPayment?.capturedAt
                  ? formatDate(subscription.latestPayment.capturedAt)
                  : "-"
              }
            />
            <Detail
              label="Provider payment ID"
              value={subscription.latestPayment?.providerPaymentId ?? "-"}
            />
          </div>
          {mutation.error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Link
              href={`/bookings/${subscription.booking.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <CalendarCheck className="h-4 w-4" /> Go to booking
            </Link>
            {canPause && (
              <button
                type="button"
                onClick={() => setPendingAction("pause")}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {canResume && (
              <button
                type="button"
                onClick={() => setPendingAction("resume")}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => setPendingAction("cancel")}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-destructive hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={`${pendingAction ?? "Update"} subscription?`}
        description={
          pendingAction
            ? `This will ${pendingAction} future AutoPay charges. Previously paid bookings will remain unchanged.`
            : ""
        }
        confirmLabel={pendingAction ?? "Confirm"}
        destructive={pendingAction === "cancel"}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) mutation.mutate(pendingAction);
        }}
      />
    </>
  );
}
