import { CalendarClock, CircleDollarSign, Clock3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types/ops";

const latestBookings: Booking[] = [
  {
    id: "bk_1001",
    bookingNumber: "YG-2401",
    customerName: "Aarav Sharma",
    customerPhone: "+91 90000 10001",
    templeName: "Sri Ranganathaswamy Temple",
    poojaName: "Archana",
    bookingDate: "2026-07-21",
    amount: 2100,
    status: "CONFIRMED",
    createdAt: "2026-07-20"
  },
  {
    id: "bk_1002",
    bookingNumber: "YG-2402",
    customerName: "Meera Iyer",
    customerPhone: "+91 90000 10002",
    templeName: "Kapaleeshwarar Temple",
    poojaName: "Abhishekam",
    bookingDate: "2026-07-22",
    amount: 5100,
    status: "PENDING",
    createdAt: "2026-07-20"
  }
];

const stats = [
  { label: "Today's Bookings", value: "42", icon: CalendarClock },
  { label: "Weekly Revenue", value: formatCurrency(684000), icon: CircleDollarSign },
  { label: "Pending Bookings", value: "18", icon: Clock3 },
  { label: "Upcoming Poojas", value: "96", icon: Sparkles }
];

export function DashboardOverview() {
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
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
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
                {latestBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-5 py-4 font-semibold">{booking.bookingNumber}</td>
                    <td className="px-5 py-4">{booking.customerName}</td>
                    <td className="px-5 py-4">{booking.poojaName}</td>
                    <td className="px-5 py-4">{formatDate(booking.bookingDate)}</td>
                    <td className="px-5 py-4">{formatCurrency(booking.amount)}</td>
                    <td className="px-5 py-4"><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{booking.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Booking confirmed", "Temple image updated", "Pooja pricing changed", "Operator session revoked"].map((item) => (
              <div key={item} className="border-l-2 border-primary pl-3">
                <p className="text-sm font-semibold">{item}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}