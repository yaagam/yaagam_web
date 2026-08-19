"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBooking, retryBookingZohoSync, updateBookingStatus } from "@/services/ops.service";
import type { BookingStatus } from "@/types/ops";

const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "SCHEDULED", "COMPLETED", "CANCELLED", "PAYMENT_FAILED"];
const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => <div><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value || "-"}</dd></div>;

export function BookingDetails() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const { data: booking, isLoading, isError } = useQuery({ queryKey: ["booking", params.id], queryFn: () => getBooking(params.id) });
  const mutation = useMutation({
    mutationFn: (status: BookingStatus) => updateBookingStatus(params.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["booking", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedStatus(null);
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

  if (isLoading) return <Card><CardContent className="py-6">Loading booking</CardContent></Card>;
  if (isError || !booking) return <Card><CardContent className="py-6 text-destructive">Unable to load booking details.</CardContent></Card>;

  const address = booking.deliveryAddress;
  const addressText = address ? [address.houseNo, address.streetName, address.location, address.district, address.state, address.pincode].filter(Boolean).join(", ") : "";

  return <>
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{booking.bookingNumber}</CardTitle></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Customer" value={booking.customerName} />
            <Detail label="WhatsApp number" value={booking.customerPhone} />
            <Detail label="Temple" value={booking.templeName} />
            <Detail label="Pooja" value={booking.poojaName} />
            <Detail label="Booking type" value={booking.type} />
            <Detail label="Current status" value={booking.status} />
            <Detail label="Payment status" value={booking.latestPaymentStatus ?? "-"} />
            <Detail label="Pooja date" value={formatDate(booking.poojaDate)} />
            <Detail label="Booked on" value={formatDate(booking.createdAt)} />
          </dl>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Status updates</p>
            {statuses.map((status) => <Button key={status} variant={booking.status === status ? "default" : "outline"} className="w-full justify-start" disabled={mutation.isPending || booking.status === status} onClick={() => setSelectedStatus(status)}>{status}</Button>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Devotee and Sankalpa Details</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {booking.devotees.length ? <div className="overflow-hidden rounded-md border border-border"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="px-4 py-3 text-left">Devotee</th><th className="px-4 py-3 text-left">Naal / Nakshatra</th></tr></thead><tbody>{booking.devotees.map((devotee, index) => <tr key={`${devotee.name}-${index}`} className="border-t border-border"><td className="px-4 py-3 font-medium">{devotee.name}</td><td className="px-4 py-3">{devotee.naal}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No devotee details available.</p>}
            <dl className="grid gap-4 sm:grid-cols-2"><Detail label="State" value={booking.devoteeState} /><Detail label="Sankalpa" value={booking.sankalpa} /><div className="sm:col-span-2"><Detail label="Special request" value={booking.specialRequest} /></div></dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prasadam Delivery</CardTitle></CardHeader>
          <CardContent>{address ? <dl className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Detail label="Delivery required" value="Yes" /></div><div className="sm:col-span-2"><Detail label="Address" value={addressText} /></div><Detail label="Delivery phone" value={address.phoneNumber} /><Detail label="Pincode" value={address.pincode} /></dl> : <><p className="font-semibold">Delivery required: No</p><p className="mt-2 text-sm text-muted-foreground">The customer did not request prasadam delivery.</p></>}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Offerings and Benefits</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {booking.offerings.length ? <div className="overflow-hidden rounded-md border border-border"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="px-4 py-3 text-left">Offering</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody>{booking.offerings.map((offering) => <tr key={offering.id} className="border-t border-border"><td className="px-4 py-3"><p className="font-medium">{offering.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(offering.unitPrice)} each</p></td><td className="px-4 py-3 text-right">{offering.quantity}</td><td className="px-4 py-3 text-right font-medium">{formatCurrency(offering.total)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No additional offerings selected.</p>}
            <div><p className="text-sm text-muted-foreground">Benefits</p><div className="mt-2 flex flex-wrap gap-2">{booking.benefits.length ? booking.benefits.map((benefit) => <span key={benefit.id} className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium">{benefit.name}</span>) : <span className="text-sm text-muted-foreground">No benefits linked.</span>}</div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[['Pooja amount', booking.amountDetails.base], ['Discount', booking.amountDetails.discount], ['Offerings', booking.amountDetails.offeringTotal], ['Dakshina', booking.amountDetails.dakshina], ['Platform fee', booking.amountDetails.platformFee], ['Platform fee GST', booking.amountDetails.platformFeeGst]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium">{formatCurrency(Number(value))}</span></div>)}
            <div className="flex justify-between gap-4 border-t border-border pt-3 text-base"><span className="font-semibold">Customer total</span><span className="font-bold">{formatCurrency(booking.amountDetails.final)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Temple payable</span><span className="font-medium">{formatCurrency(booking.amountDetails.templePayable)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle>Zoho Books</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-center gap-3"><span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">{booking.zohoSyncStatus}</span>{booking.zohoBillId && <span className="text-sm text-muted-foreground">Temple bill ID: {booking.zohoBillId}</span>}</div>{booking.zohoSyncError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{booking.zohoSyncError}</p>}{zohoRetryMutation.isError && <p className="text-sm font-medium text-destructive">Unable to retry Zoho sync.</p>}{(booking.zohoSyncStatus !== "SYNCED" || !booking.zohoBillId) && <Button type="button" variant="outline" disabled={zohoRetryMutation.isPending} onClick={() => zohoRetryMutation.mutate()}><RefreshCw className={`h-4 w-4 ${zohoRetryMutation.isPending ? "animate-spin" : ""}`} />{zohoRetryMutation.isPending ? "Retrying Zoho sync" : "Retry Zoho sync"}</Button>}</CardContent></Card>
    </div>
    <ConfirmDialog open={selectedStatus !== null} title="Change booking status?" description={`Change booking ${booking.bookingNumber} from ${booking.status} to ${selectedStatus ?? ""}?`} confirmLabel="Change status" destructive={selectedStatus === "CANCELLED" || selectedStatus === "PAYMENT_FAILED"} pending={mutation.isPending} onCancel={() => setSelectedStatus(null)} onConfirm={() => { if (selectedStatus) mutation.mutate(selectedStatus); }} />
  </>;
}