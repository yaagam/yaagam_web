"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookings } from "@/services/ops.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

function queryErrorMessage(error: unknown) {
  const value = (error as { response?: { status?: number; data?: { message?: string | string[] } } }).response;
  if (value?.status === 401) return "Your operator session has expired. Sign in again to load bookings.";
  const message = value?.data?.message;
  return Array.isArray(message) ? message.join(" ") : message ?? "Unable to load bookings from the server.";
}

export function BookingsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const queryParams = { page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(status ? { status } : {}) };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bookings", queryParams],
    queryFn: () => getBookings(queryParams)
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>Bookings</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search bookings" className="pl-9" />
          </label>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {error && <div className="mx-5 mb-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive"><span>{queryErrorMessage(error)}</span><button type="button" onClick={() => void refetch()} className="rounded border border-red-300 px-3 py-1" disabled={isFetching}>Retry</button></div>}
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
            {!isLoading && !error && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={7}>No bookings found.</td></tr>}
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
