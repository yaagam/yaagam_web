"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookings } from "@/services/ops.service";
import { formatCurrency, formatDate } from "@/lib/utils";

export function BookingsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["bookings", page, search, status],
    queryFn: () => getBookings({ page, limit: 20, search, status })
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>Bookings</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bookings" className="pl-9" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Booking</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Temple</th>
              <th className="px-5 py-3">Pooja</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={7}>Loading bookings</td></tr>}
            {data?.items.map((booking) => (
              <tr key={booking.id}>
                <td className="px-5 py-4 font-semibold"><Link href={`/bookings/${booking.id}`} className="text-primary">{booking.bookingNumber}</Link></td>
                <td className="px-5 py-4">{booking.customerName}</td>
                <td className="px-5 py-4">{booking.templeName}</td>
                <td className="px-5 py-4">{booking.poojaName}</td>
                <td className="px-5 py-4">{formatDate(booking.bookingDate)}</td>
                <td className="px-5 py-4">{formatCurrency(booking.amount)}</td>
                <td className="px-5 py-4"><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{booking.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-muted-foreground">Page {page} of {data?.meta.totalPages ?? 1}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Previous</button>
            <button disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Next</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}