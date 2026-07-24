"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBooking, updateBookingStatus } from "@/services/ops.service";
import type { BookingStatus } from "@/types/ops";

const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "SCHEDULED", "COMPLETED", "CANCELLED", "PAYMENT_FAILED"];

export function BookingDetails() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", params.id],
    queryFn: () => getBooking(params.id)
  });
  const mutation = useMutation({
    mutationFn: (status: BookingStatus) => updateBookingStatus(params.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["booking", params.id] })
  });

  if (isLoading) return <Card><CardContent>Loading booking</CardContent></Card>;
  if (!booking) return <Card><CardContent>Booking not found.</CardContent></Card>;

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
          <p className="text-sm font-semibold">Status updates</p>
          {statuses.map((status) => (
            <Button key={status} variant={booking.status === status ? "default" : "outline"} className="w-full justify-start" disabled={mutation.isPending} onClick={() => mutation.mutate(status)}>
              {status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}