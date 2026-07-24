"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CircleDollarSign, Clock3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBookings, getDashboardSummary } from "@/services/ops.service";

export function DashboardOverview() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary
  });
  const { data: latestBookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["dashboard-latest-bookings"],
    queryFn: () => getBookings({ page: 1, limit: 5 })
  });

  const stats = [
    { label: "Total Bookings", value: summary?.bookings.toString() ?? "-", icon: CalendarClock },
    { label: "Total Temples", value: summary?.temples.toString() ?? "-", icon: CircleDollarSign },
    { label: "Open Tickets", value: summary?.openSupportTickets.toString() ?? "-", icon: Clock3 },
    { label: "Total Poojas", value: summary?.poojas.toString() ?? "-", icon: Sparkles }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live operational summary for the Yaagam console.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{isSummaryLoading ? "Loading" : stat.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Latest Bookings</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Pooja</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isBookingsLoading && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={6}>Loading bookings</td></tr>}
                {latestBookings?.items.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-5 py-4 font-semibold">{booking.bookingNumber}</td>
                    <td className="px-5 py-4">{booking.customerName}</td>
                    <td className="px-5 py-4">{booking.poojaName}</td>
                    <td className="px-5 py-4">{formatDate(booking.bookingDate)}</td>
                    <td className="px-5 py-4">{formatCurrency(booking.amount)}</td>
                    <td className="px-5 py-4"><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{booking.status}</span></td>
                  </tr>
                ))}
                {!isBookingsLoading && latestBookings?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={6}>No bookings found.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Users", summary?.users],
              ["Temples", summary?.temples],
              ["Poojas", summary?.poojas],
              ["Open support tickets", summary?.openSupportTickets]
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-primary pl-3">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{isSummaryLoading ? "Loading" : value ?? 0}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}