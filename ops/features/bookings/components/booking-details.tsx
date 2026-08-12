"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import {
  getBooking,
  retryBookingZohoSync,
  updateBookingStatus,
} from "@/services/ops.service";
import type { BookingStatus } from "@/types/ops";

const statuses: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "PAYMENT_FAILED",
];

export function BookingDetails() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", params.id],
    queryFn: () => getBooking(params.id),
  });
  const mutation = useMutation({
    mutationFn: (status: BookingStatus) =>
      updateBookingStatus(params.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["booking", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      success("Booking status updated successfully.");
    },
  });
  const zohoRetryMutation = useMutation({
    mutationFn: () => retryBookingZohoSync(params.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["booking", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      success("Zoho booking sync completed successfully.");
    },
  });

  if (isLoading)
    return (
      <Card>
        <CardContent>Loading booking</CardContent>
      </Card>
    );
  if (!booking)
    return (
      <Card>
        <CardContent>Booking not found.</CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{booking.bookingNumber}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Customer</dt><dd className="font-semibold">{booking.customerName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Phone</dt><dd className="font-semibold">{booking.customerPhone}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Temple</dt><dd className="font-semibold">{booking.templeName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Pooja</dt><dd className="font-semibold">{booking.poojaName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Current Status</dt><dd className="font-semibold">{booking.status}</dd></div>
        </dl>
        <div className="space-y-3">
          <div className="space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Zoho Books</p>
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">
                {booking.zohoSyncStatus}
              </span>
            </div>
            {booking.zohoSyncError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-destructive">
                {booking.zohoSyncError}
              </p>
            )}
            {booking.zohoBillId && (
              <p className="text-xs text-muted-foreground">
                Temple bill ID: {booking.zohoBillId}
              </p>
            )}
            {zohoRetryMutation.isError && (
              <p className="text-xs font-medium text-destructive">
                {zohoRetryMutation.error instanceof Error
                  ? zohoRetryMutation.error.message
                  : "Unable to retry Zoho sync."}
              </p>
            )}
            {(booking.zohoSyncStatus !== "SYNCED" || !booking.zohoBillId) && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={zohoRetryMutation.isPending}
                onClick={() => zohoRetryMutation.mutate()}
              >
                <RefreshCw
                  className={`h-4 w-4 ${zohoRetryMutation.isPending ? "animate-spin" : ""}`}
                />
                {zohoRetryMutation.isPending
                  ? "Retrying Zoho sync"
                  : "Retry Zoho sync"}
              </Button>
            )}
          </div>
          <p className="text-sm font-semibold">Status updates</p>
          {statuses.map((status) => (
            <Button
              key={status}
              variant={booking.status === status ? "default" : "outline"}
              className="w-full justify-start"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}