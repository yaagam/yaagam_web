"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubscriptionStatusView } from "@/features/subscriptions/components/subscription-status";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSubscriptions } from "@/services/ops.service";
import type { SubscriptionStatus } from "@/types/ops";

const statuses: SubscriptionStatus[] = [
  "CREATING",
  "CREATED",
  "AUTHENTICATED",
  "ACTIVE",
  "PAUSED",
  "HALTED",
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
  "FAILED",
];

function errorMessage(error: unknown) {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  ).response?.data?.message;
  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "Unable to load subscriptions.");
}

export function SubscriptionsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const params = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
  };
  const query = useQuery({
    queryKey: ["subscriptions", params],
    queryFn: () => getSubscriptions(params),
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Subscription Manager</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a subscription to view payments, cycles, AutoPay state, and
            controls.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Phone, booking or subscription"
              className="pl-9"
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SubscriptionStatus | "");
              setPage(1);
            }}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {query.error && (
          <div className="mx-5 mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">
            <span>{errorMessage(query.error)}</span>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="inline-flex items-center gap-2 rounded border px-3 py-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}
        <table className="min-w-[850px] w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Subscription</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Pooja</th>
              <th className="px-5 py-3">Weekly amount</th>
              <th className="px-5 py-3">Next charge</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {query.isLoading && (
              <tr>
                <td className="px-5 py-8 text-muted-foreground" colSpan={7}>
                  Loading subscriptions
                </td>
              </tr>
            )}
            {query.data?.items.map((subscription) => (
              <tr key={subscription.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold">{subscription.reference}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {subscription.booking.bookingNumber}
                  </p>
                </td>
                <td className="px-5 py-4">
                  {subscription.customer.whatsappNumber ?? "-"}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium">{subscription.pooja.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {subscription.temple.name}
                  </p>
                </td>
                <td className="px-5 py-4">
                  {formatCurrency(subscription.amount)} / week
                </td>
                <td className="px-5 py-4">
                  {subscription.nextChargeAt
                    ? formatDate(subscription.nextChargeAt)
                    : "-"}
                </td>
                <td className="px-5 py-4">
                  <SubscriptionStatusView subscription={subscription} />
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/subscriptions/${subscription.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-medium hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Link>
                </td>
              </tr>
            ))}
            {!query.isLoading &&
              !query.error &&
              query.data?.items.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-muted-foreground" colSpan={7}>
                    No subscriptions found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {query.data?.meta.totalPages || 1} �{" "}
            {query.data?.meta.total ?? 0} subscriptions
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-md border border-border px-3 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= (query.data?.meta.totalPages || 1)}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-md border border-border px-3 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
