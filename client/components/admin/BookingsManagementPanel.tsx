"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, IndianRupee, Loader2, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_BOOKING_STATUSES as bookingStatuses, ADMIN_BOOKING_TYPES as bookingTypes, ADMIN_LARGE_PAGE_SIZE_OPTIONS as pageSizeOptions, ADMIN_PAYMENT_STATUSES as paymentStatuses, ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS } from "@/constants/admin-management.const";
import {
  getAdminBookingsApi,
  type AdminBookingItem,
  type BookingStatus,
  type BookingType,
  type PaymentStatus,
} from "@/lib/api/admin/management/admin-management.api";
import { getAdminTemplesApi, type Temple } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";



function label(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTempleLabel(temple: Temple) {
  const translation =
    temple.translations.find((item) => item.language === "EN") ??
    temple.translations[0];

  return translation?.name ?? "Untitled temple";
}

type BookingFilters = {
  status: BookingStatus | "";
  type: BookingType | "";
  paymentStatus: PaymentStatus | "";
  templeId: string;
};

const emptyBookingFilters: BookingFilters = {
  status: "",
  type: "",
  paymentStatus: "",
  templeId: "",
};

function getActiveFilterCount(filters: BookingFilters) {
  return Object.values(filters).filter(Boolean).length;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status: BookingStatus) {
  if (status === "COMPLETED") return "bg-[#e7f8ee] text-[#1f9b52]";
  if (status === "SCHEDULED") return "bg-[#fff1dc] text-[#e67e22]";
  if (status === "PAYMENT_FAILED" || status === "CANCELLED") return "bg-red-50 text-red-600";
  if (status === "PENDING_PAYMENT") return "bg-[#e9f1ff] text-[#2463d5]";
  return "bg-[#f4e8ff] text-[#9b45df]";
}

export function BookingsManagementPanel() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<BookingFilters>(emptyBookingFilters);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadTemples() {
      try {
        const response = await getAdminTemplesApi({ page: 1, limit: 100 });
        if (isActive) setTemples(response.items);
      } catch {
        if (isActive) setTemples([]);
      }
    }

    void loadTemples();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let isActive = true;

    async function loadBookings() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getAdminBookingsApi({
          page,
          limit: pageSize,
          search: debouncedSearch,
          status: filters.status,
          type: filters.type,
          paymentStatus: filters.paymentStatus,
          templeId: filters.templeId,
        });

        if (!isActive) return;

        setBookings(response.items);
        setTotalBookings(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;

        setBookings([]);
        setTotalBookings(0);
        setTotalPages(1);
        setError(getErrorMessage(loadError, "Unable to load bookings."));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadBookings();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, filters, page, pageSize, reloadKey]);

  const safePage = Math.min(page, totalPages);
  const visibleStart = totalBookings === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min((safePage - 1) * pageSize + bookings.length, totalBookings);
  const isSearchPending = search.trim() !== debouncedSearch;
  const activeFilterCount = getActiveFilterCount(filters);

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setFilters(emptyBookingFilters);
    setPage(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">Bookings Management</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">Bookings</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
            Search bookings and filter by temple, status, plan type, or payment status.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <label className="relative block min-w-0 lg:w-80">
            <span className="sr-only">Search bookings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, pooja, temple, WhatsApp" className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron" />
          </label>

          <div className="relative lg:w-80">
            <button
              type="button"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-3 text-left text-sm font-bold text-text-primary outline-none transition-colors hover:border-saffron focus:border-saffron"
              aria-expanded={isFilterOpen}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-saffron" />
                <span className="truncate">{activeFilterCount > 0 ? `${activeFilterCount} filters selected` : "All filters"}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-primary/45" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 z-30 mt-2 max-h-[28rem] w-full overflow-y-auto rounded-lg border border-black/10 bg-white p-3 shadow-xl lg:w-96">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-text-primary">Filters</p>
                  <button type="button" onClick={() => setFilters(emptyBookingFilters)} className="text-xs font-extrabold text-saffron hover:text-[#c96c1a]">Clear</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">Temples</p>
                    <div className="space-y-1">
                      {temples.map((temple) => {
                        const isSelected = filters.templeId === temple.id;
                        return (
                          <button key={temple.id} type="button" onClick={() => { setFilters((current) => ({ ...current, templeId: isSelected ? "" : temple.id })); setPage(1); }} className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-bold text-text-primary hover:bg-saffron/10">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-saffron bg-saffron text-white" : "border-black/20 bg-white"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                            <span className="min-w-0 truncate">{getTempleLabel(temple)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">Booking statuses</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {bookingStatuses.map((option) => {
                        const isSelected = filters.status === option;
                        return (
                          <button key={option} type="button" onClick={() => { setFilters((current) => ({ ...current, status: isSelected ? "" : option })); setPage(1); }} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-left text-sm font-bold text-text-primary hover:bg-saffron/10">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-saffron bg-saffron text-white" : "border-black/20 bg-white"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                            <span className="min-w-0 truncate">{label(option)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">Plans</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {bookingTypes.map((option) => {
                        const isSelected = filters.type === option;
                        return (
                          <button key={option} type="button" onClick={() => { setFilters((current) => ({ ...current, type: isSelected ? "" : option })); setPage(1); }} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-left text-sm font-bold text-text-primary hover:bg-saffron/10">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-saffron bg-saffron text-white" : "border-black/20 bg-white"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                            <span className="min-w-0 truncate">{label(option)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">Payments</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {paymentStatuses.map((option) => {
                        const isSelected = filters.paymentStatus === option;
                        return (
                          <button key={option} type="button" onClick={() => { setFilters((current) => ({ ...current, paymentStatus: isSelected ? "" : option })); setPage(1); }} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-left text-sm font-bold text-text-primary hover:bg-saffron/10">
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-saffron bg-saffron text-white" : "border-black/20 bg-white"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                            <span className="min-w-0 truncate">{label(option)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron lg:w-36">
            {pageSizeOptions.map((option) => <option key={option} value={option}>{option} rows</option>)}
          </select>

          <Button type="button" variant="outline" disabled={isLoading} onClick={() => setReloadKey((current) => current + 1)} className="min-h-11 rounded-lg lg:w-36">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-text-primary/65">Showing {visibleStart}-{visibleEnd} of {totalBookings}</p>
          <div className="flex items-center gap-3">
            {isSearchPending && <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron"><Loader2 className="h-3.5 w-3.5 animate-spin" />Searching</span>}
            <button type="button" onClick={resetFilters} className="text-xs font-extrabold text-saffron hover:text-[#c96c1a]">Reset filters</button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><Loader2 className="h-8 w-8 animate-spin text-saffron" /><p className="text-sm font-bold text-text-primary/65">Loading bookings</p></div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><p className="text-lg font-extrabold text-text-primary">Could not load bookings</p><p className="max-w-md text-sm leading-6 text-red-600">{error}</p></div>
        ) : bookings.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><ClipboardList className="h-8 w-8 text-text-primary/35" /><p className="text-lg font-extrabold text-text-primary">No bookings found</p><p className="max-w-md text-sm leading-6 text-text-primary/60">Try changing search or filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                <tr><th className="px-5 py-3">Booking</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Pooja</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="align-top">
                    <td className="px-5 py-4"><p className="text-sm font-extrabold text-text-primary">{booking.bookingNumber}</p><p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">{booking.id}</p></td>
                    <td className="px-5 py-4"><p className="text-sm font-bold text-text-primary">+91 {booking.bookingWhatsappNumber}</p><p className="mt-1 text-xs font-semibold text-text-primary/45">{booking.user.isWhatsappVerified ? "Verified user" : "Unverified user"}</p></td>
                    <td className="px-5 py-4"><p className="text-sm font-extrabold text-text-primary">{booking.pooja.name}</p><p className="mt-1 text-xs font-semibold text-text-primary/55">{booking.temple.name}</p></td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-saffron" />{formatDate(booking.bookingDate)}</span></td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">{label(booking.type)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(booking.status)}`}>{label(booking.status)}</span></td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">{booking.latestPaymentStatus ? label(booking.latestPaymentStatus) : "-"}</td>
                    <td className="px-5 py-4"><p className="inline-flex items-center gap-1 text-sm font-extrabold text-saffron"><IndianRupee className="h-4 w-4" />{formatAmount(booking.amount.final).replace("?", "")}</p>{booking.amount.discount > 0 && <p className="mt-1 text-xs font-semibold text-text-primary/45">Discount {formatAmount(booking.amount.discount)}</p>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-text-primary/60">Page {safePage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft className="h-4 w-4" />Previous</button>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45">Next<ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}