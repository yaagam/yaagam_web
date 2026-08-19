"use client";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBookingFilterOptions, getBookings, type BookingListParams } from "@/services/ops.service";
import type { Booking } from "@/types/ops";

function errorMessage(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { message?: string | string[] } } }).response;
  if (response?.status === 401) return "Your operator session has expired.";
  const message = response?.data?.message;
  return Array.isArray(message) ? message.join(" ") : message ?? "Unable to load bookings.";
}
function boundary(value: string, end = false) {
  return value ? `${value}T${end ? "23:59:59.999" : "00:00:00.000"}+05:30` : undefined;
}
function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
function downloadCsv(bookings: Booking[]) {
  const headers = [
    "Booking ID", "Booking Number", "User ID", "Customer Name",
    "Customer Phone", "Temple ID", "Temple", "Pooja ID", "Pooja",
    "Benefits", "Booking Date", "Pooja Date", "Booking Type",
    "Booking Status", "Payment Status", "Base Amount", "Discount",
    "Dakshina", "Offering Total", "Platform Fee", "Platform Fee GST",
    "Temple Payable", "Final Amount", "Currency", "Devotees", "Naal",
    "Devotee State", "Special Request", "Sankalpa", "House No",
    "Street", "Location", "District", "State", "Pincode",
    "Address Phone", "Offerings", "Zoho Status", "Zoho Error",
    "Zoho Sales Order ID", "Zoho Invoice ID", "Zoho Payment ID",
    "Zoho Bill ID", "Created At", "Updated At",
  ];
  const rows = [
    headers,
    ...bookings.map((booking) => {
      const address = booking.deliveryAddress;
      return [
        booking.id, booking.bookingNumber, booking.userId, booking.customerName,
        booking.customerPhone, booking.templeId, booking.templeName, booking.poojaId,
        booking.poojaName, booking.benefits.map((item) => item.name).join("; "),
        booking.bookingDate, booking.poojaDate, booking.type, booking.status,
        booking.latestPaymentStatus ?? "", booking.amountDetails.base,
        booking.amountDetails.discount, booking.amountDetails.dakshina,
        booking.amountDetails.offeringTotal, booking.amountDetails.platformFee,
        booking.amountDetails.platformFeeGst, booking.amountDetails.templePayable,
        booking.amountDetails.final, booking.amountDetails.currency,
        booking.devotees.map((item) => item.name).join("; "),
        booking.devotees.map((item) => item.naal).join("; "),
        booking.devoteeState ?? "", booking.specialRequest ?? "",
        booking.sankalpa ?? "", address?.houseNo ?? "",
        address?.streetName ?? "", address?.location ?? "",
        address?.district ?? "", address?.state ?? "", address?.pincode ?? "",
        address?.phoneNumber ?? "",
        booking.offerings.map((item) =>
          `${item.name} | Qty: ${item.quantity} | Unit: ${item.unitPrice} | Total: ${item.total}`,
        ).join("; "),
        booking.zohoSyncStatus, booking.zohoSyncError ?? "",
        booking.zohoSalesOrderId ?? "", booking.zohoInvoiceId ?? "",
        booking.zohoPaymentId ?? "", booking.zohoBillId ?? "",
        booking.createdAt, booking.updatedAt,
      ];
    }),
  ];
  const blob = new Blob(
    ["\uFEFF", rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BookingsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [templeId, setTempleId] = useState("");
  const [poojaId, setPoojaId] = useState("");
  const [bookingFrom, setBookingFrom] = useState("");
  const [bookingTo, setBookingTo] = useState("");
  const [poojaFrom, setPoojaFrom] = useState("");
  const [poojaTo, setPoojaTo] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search.trim());
  const filters: BookingListParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status && { status }), ...(templeId && { templeId }), ...(poojaId && { poojaId }),
    ...(bookingFrom && { bookingDateFrom: boundary(bookingFrom) }),
    ...(bookingTo && { bookingDateTo: boundary(bookingTo, true) }),
    ...(poojaFrom && { poojaDateFrom: boundary(poojaFrom) }),
    ...(poojaTo && { poojaDateTo: boundary(poojaTo, true) }),
  };
  const params = { ...filters, page, limit: 20 };
  const bookingsQuery = useQuery({ queryKey: ["bookings", params], queryFn: () => getBookings(params) });
  const filterOptionsQuery = useQuery({
    queryKey: ["booking-filter-options"],
    queryFn: getBookingFilterOptions,
  });
  const changed = () => setPage(1);
  const hasFilters = Boolean(search || status || templeId || poojaId || bookingFrom || bookingTo || poojaFrom || poojaTo);

  function clearFilters() {
    setSearch(""); setStatus(""); setTempleId(""); setPoojaId("");
    setBookingFrom(""); setBookingTo(""); setPoojaFrom(""); setPoojaTo(""); setPage(1);
  }
  async function exportBookings() {
    setExporting(true); setExportError(null);
    try {
      const rows: Booking[] = [];
      let current = 1, totalPages = 1;
      do {
        const result = await getBookings({ ...filters, page: current, limit: 500 });
        rows.push(...result.items); totalPages = result.meta.totalPages; current += 1;
      } while (current <= totalPages);
      downloadCsv(rows);
    } catch (error) { setExportError(errorMessage(error)); }
    finally { setExporting(false); }
  }

  return <Card>
    <CardHeader className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Bookings</CardTitle>
        <button type="button" onClick={() => void exportBookings()} disabled={exporting || bookingsQuery.isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          <Download className="h-4 w-4" />{exporting ? "Exporting?" : "Export Excel"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); changed(); }} placeholder="Booking, phone, temple or pooja" className="pl-9" /></label>
        <select value={templeId} onChange={(e) => { setTempleId(e.target.value); changed(); }} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All temples</option>{filterOptionsQuery.data?.temples.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select value={poojaId} onChange={(e) => { setPoojaId(e.target.value); changed(); }} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All poojas</option>{filterOptionsQuery.data?.poojas.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); changed(); }} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option>
          <option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          <option value="PAYMENT_FAILED">Payment failed</option>
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {([["Booking date from", bookingFrom, setBookingFrom], ["Booking date to", bookingTo, setBookingTo],
          ["Pooja date from", poojaFrom, setPoojaFrom], ["Pooja date to", poojaTo, setPoojaTo]] as const).map(([label, value, setter]) =>
          <label key={label} className="text-xs font-medium text-muted-foreground">{label}
            <Input type="date" value={value} onChange={(e) => { setter(e.target.value); changed(); }} className="mt-1" /></label>)}
      </div>
      {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary"><X className="h-4 w-4" />Clear filters</button>}
    </CardHeader>
    <CardContent className="overflow-x-auto p-0">
      {(bookingsQuery.error || exportError) && <div className="mx-5 mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
        {exportError ?? errorMessage(bookingsQuery.error)}</div>}
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr>
          {["Booking", "Customer", "Temple", "Pooja", "Booking date", "Pooja date", "Amount", "Status"].map((x) => <th key={x} className="px-5 py-3">{x}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-border">
          {bookingsQuery.isLoading && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={8}>Loading bookings</td></tr>}
          {bookingsQuery.data?.items.map((b) => <tr key={b.id}>
            <td className="px-5 py-4 font-semibold"><Link href={`/bookings/${b.id}`} className="text-primary">{b.bookingNumber}</Link></td>
            <td className="px-5 py-4">{b.customerName}</td><td className="px-5 py-4">{b.templeName}</td><td className="px-5 py-4">{b.poojaName}</td>
            <td className="px-5 py-4">{formatDate(b.bookingDate)}</td><td className="px-5 py-4">{formatDate(b.poojaDate)}</td>
            <td className="px-5 py-4">{formatCurrency(b.amount)}</td><td className="px-5 py-4"><span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{b.status}</span></td>
          </tr>)}
          {!bookingsQuery.isLoading && !bookingsQuery.error && bookingsQuery.data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={8}>No bookings found.</td></tr>}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
        <span className="text-muted-foreground">Page {page} of {bookingsQuery.data?.meta.totalPages ?? 1} ? {bookingsQuery.data?.meta.total ?? 0} bookings</span>
        <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))} className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Previous</button>
          <button disabled={page >= (bookingsQuery.data?.meta.totalPages ?? 1)} onClick={() => setPage((x) => x + 1)} className="rounded-md border border-border px-3 py-2 disabled:opacity-50">Next</button></div>
      </div>
    </CardContent>
  </Card>;
}
