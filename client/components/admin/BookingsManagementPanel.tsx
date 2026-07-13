"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ADMIN_BOOKING_STATUSES as bookingStatuses,
  ADMIN_BOOKING_TYPES as bookingTypes,
  ADMIN_LARGE_PAGE_SIZE_OPTIONS as pageSizeOptions,
  ADMIN_PAYMENT_STATUSES as paymentStatuses,
  ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS,
} from "@/constants/admin-management.const";
import {
  getAdminBookingsApi,
  type AdminBookingItem,
  type BookingStatus,
  type BookingType,
  type PaymentStatus,
} from "@/lib/api/admin/management/admin-management.api";
import {
  getAdminTemplesApi,
  type Temple,
} from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

function label(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  bookingDateFrom: string;
  bookingDateTo: string;
};

const emptyBookingFilters: BookingFilters = {
  status: "",
  type: "",
  paymentStatus: "",
  templeId: "",
  bookingDateFrom: "",
  bookingDateTo: "",
};


type FilterSection = "status" | "type" | "payment" | "temple" | "dateRange";

const filterSections: { id: FilterSection; label: string }[] = [
  { id: "status", label: "Booking Status" },
  { id: "type", label: "Plan" },
  { id: "payment", label: "Payment" },
  { id: "temple", label: "Temple" },
  { id: "dateRange", label: "Date Range" },
];
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
  if (status === "PAYMENT_FAILED" || status === "CANCELLED") {
    return "bg-red-50 text-red-600";
  }
  if (status === "PENDING_PAYMENT") return "bg-[#e9f1ff] text-[#2463d5]";
  return "bg-[#f4e8ff] text-[#9b45df]";
}

function escapeExcelCell(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadExcelFile(bookings: AdminBookingItem[], filename: string) {
  const headers = [
    "Booking Number",
    "Booking ID",
    "User WhatsApp",
    "Verified User",
    "Pooja",
    "Temple",
    "Booking Date",
    "Plan",
    "Status",
    "Payment Status",
    "Base Amount",
    "Discount",
    "Final Amount",
    "Currency",
    "Created At",
  ];

  const rows = bookings.map((booking) => [
    booking.bookingNumber,
    booking.id,
    `+91 ${booking.bookingWhatsappNumber}`,
    booking.user.isWhatsappVerified ? "Yes" : "No",
    booking.pooja.name,
    booking.temple.name,
    formatDate(booking.bookingDate),
    label(booking.type),
    label(booking.status),
    booking.latestPaymentStatus ? label(booking.latestPaymentStatus) : "-",
    booking.amount.base,
    booking.amount.discount,
    booking.amount.final,
    booking.amount.currency,
    formatDate(booking.createdAt),
  ]);

  const tableRows = [headers, ...rows]
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeExcelCell(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const worksheet = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
  const blob = new Blob([worksheet], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getSelectedTempleName(temples: Temple[], templeId: string) {
  if (!templeId) return "all-temples";

  const temple = temples.find((item) => item.id === templeId);
  return (temple ? getTempleLabel(temple) : "selected-temple")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function getDateRangeLabel(filters: BookingFilters) {
  if (filters.bookingDateFrom && filters.bookingDateTo) {
    return `${filters.bookingDateFrom}-to-${filters.bookingDateTo}`;
  }

  if (filters.bookingDateFrom) return `from-${filters.bookingDateFrom}`;
  if (filters.bookingDateTo) return `until-${filters.bookingDateTo}`;

  return "all-dates";
}
export function BookingsManagementPanel() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<BookingFilters>(emptyBookingFilters);
  const [draftFilters, setDraftFilters] =
    useState<BookingFilters>(emptyBookingFilters);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] =
    useState<FilterSection>("dateRange");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
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
          bookingDateFrom: filters.bookingDateFrom,
          bookingDateTo: filters.bookingDateTo,
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
  const visibleEnd = Math.min(
    (safePage - 1) * pageSize + bookings.length,
    totalBookings,
  );
  const isSearchPending = search.trim() !== debouncedSearch;
  const activeFilterCount = getActiveFilterCount(filters);
  const draftFilterCount = getActiveFilterCount(draftFilters);


  function openFilters() {
    setDraftFilters(filters);
    setActiveFilterSection("dateRange");
    setIsFilterOpen(true);
  }

  function closeFilters() {
    setDraftFilters(filters);
    setIsFilterOpen(false);
  }

  function updateDraftFilter(nextFilters: Partial<BookingFilters>) {
    setDraftFilters((current) => ({ ...current, ...nextFilters }));
  }

  function clearDraftFilters() {
    setDraftFilters(emptyBookingFilters);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setExportError("");
    setPage(1);
    setIsFilterOpen(false);
  }

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setFilters(emptyBookingFilters);
    setExportError("");
    setPage(1);
  }

  async function exportBookings() {

    setIsExporting(true);
    setExportError("");

    try {
      const exportPageSize = 500;
      let nextPage = 1;
      let nextTotalPages = 1;
      const exportedBookings: AdminBookingItem[] = [];

      do {
        const response = await getAdminBookingsApi({
          page: nextPage,
          limit: exportPageSize,
          search: debouncedSearch,
          status: filters.status,
          type: filters.type,
          paymentStatus: filters.paymentStatus,
          templeId: filters.templeId,
          bookingDateFrom: filters.bookingDateFrom,
          bookingDateTo: filters.bookingDateTo,
        });

        exportedBookings.push(...response.items);
        nextTotalPages = Math.max(1, response.meta.totalPages);
        nextPage += 1;
      } while (nextPage <= nextTotalPages);

      if (exportedBookings.length === 0) {
        setExportError("No bookings found for the selected export filters.");
        return;
      }

      const templeName = getSelectedTempleName(temples, filters.templeId);
      const dateRangeLabel = getDateRangeLabel(filters);
      downloadExcelFile(
        exportedBookings,
        `bookings-${dateRangeLabel}-${templeName}.xls`,
      );
    } catch (exportFailure: unknown) {
      setExportError(
        getErrorMessage(exportFailure, "Unable to export bookings."),
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Bookings Management
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            Bookings
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
            Search bookings, filter by temple and booking period, then export the matching rows to Excel.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <label className="relative block min-w-0 lg:w-80">
            <span className="sr-only">Search bookings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking, pooja, temple, WhatsApp"
              className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
            />
          </label>

          <div className="lg:w-80">
            <button
              type="button"
              onClick={openFilters}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-3 text-left text-sm font-bold text-text-primary outline-none transition-colors hover:border-saffron focus:border-saffron"
              aria-expanded={isFilterOpen}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-saffron" />
                <span className="truncate">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filters selected`
                    : "All filters"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-primary/45" />
            </button>

            {isFilterOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 py-6">
                <button
                  type="button"
                  className="absolute inset-0 cursor-default"
                  aria-label="Close filters"
                  onClick={closeFilters}
                />
                <div className="relative z-10 flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
                  <div className="flex min-h-14 items-center justify-between border-b border-black/10 px-4 sm:px-5">
                    <div>
                      <p className="text-base font-extrabold text-text-primary">
                        Filters
                      </p>
                      {draftFilterCount > 0 && (
                        <p className="text-xs font-bold text-text-primary/50">
                          {draftFilterCount} selected
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={closeFilters}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary/65 transition-colors hover:bg-black/5 hover:text-text-primary"
                      aria-label="Close filters"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid min-h-[28rem] flex-1 overflow-hidden md:grid-cols-[13rem_1fr]">
                    <nav className="flex overflow-x-auto border-b border-black/10 bg-[#f8fafc] md:block md:overflow-visible md:border-b-0 md:border-r">
                      {filterSections.map((section) => {
                        const isActive = activeFilterSection === section.id;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveFilterSection(section.id)}
                            className={`relative min-h-12 shrink-0 px-4 text-left text-sm font-bold transition-colors md:flex md:w-full md:items-center ${
                              isActive
                                ? "bg-white text-text-primary"
                                : "text-text-primary/70 hover:bg-white/70 hover:text-text-primary"
                            }`}
                          >
                            <span
                              className={`absolute bottom-0 left-0 h-0.5 w-full bg-saffron md:bottom-auto md:top-0 md:h-full md:w-0.5 ${
                                isActive ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {section.label}
                          </button>
                        );
                      })}
                    </nav>

                    <div className="overflow-y-auto px-4 py-5 sm:px-6">
                      {activeFilterSection === "status" && (
                        <div>
                          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                            Booking Status
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {bookingStatuses.map((option) => {
                              const isSelected = draftFilters.status === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    updateDraftFilter({
                                      status: isSelected ? "" : option,
                                    })
                                  }
                                  className="flex min-h-9 items-center gap-3 text-left text-sm font-semibold text-text-primary"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-saffron bg-saffron text-white"
                                        : "border-black/15 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{label(option)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeFilterSection === "type" && (
                        <div>
                          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                            Plan
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {bookingTypes.map((option) => {
                              const isSelected = draftFilters.type === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    updateDraftFilter({
                                      type: isSelected ? "" : option,
                                    })
                                  }
                                  className="flex min-h-9 items-center gap-3 text-left text-sm font-semibold text-text-primary"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-saffron bg-saffron text-white"
                                        : "border-black/15 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{label(option)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeFilterSection === "payment" && (
                        <div>
                          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                            Payment Status
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {paymentStatuses.map((option) => {
                              const isSelected =
                                draftFilters.paymentStatus === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    updateDraftFilter({
                                      paymentStatus: isSelected ? "" : option,
                                    })
                                  }
                                  className="flex min-h-9 items-center gap-3 text-left text-sm font-semibold text-text-primary"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-saffron bg-saffron text-white"
                                        : "border-black/15 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{label(option)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeFilterSection === "temple" && (
                        <div>
                          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                            Temple
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {temples.map((temple) => {
                              const isSelected = draftFilters.templeId === temple.id;
                              return (
                                <button
                                  key={temple.id}
                                  type="button"
                                  onClick={() =>
                                    updateDraftFilter({
                                      templeId: isSelected ? "" : temple.id,
                                    })
                                  }
                                  className="flex min-h-9 items-center gap-3 text-left text-sm font-semibold text-text-primary"
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-saffron bg-saffron text-white"
                                        : "border-black/15 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span className="min-w-0 truncate">
                                    {getTempleLabel(temple)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeFilterSection === "dateRange" && (
                        <div>
                          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-text-primary/45">
                            Date Range
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-text-primary/70">
                                Booking date from
                              </span>
                              <input
                                type="date"
                                value={draftFilters.bookingDateFrom}
                                onChange={(event) =>
                                  updateDraftFilter({
                                    bookingDateFrom: event.target.value,
                                  })
                                }
                                className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-text-primary/70">
                                Booking date to
                              </span>
                              <input
                                type="date"
                                value={draftFilters.bookingDateTo}
                                min={draftFilters.bookingDateFrom || undefined}
                                onChange={(event) =>
                                  updateDraftFilter({
                                    bookingDateTo: event.target.value,
                                  })
                                }
                                className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-4 sm:px-5">
                    <button
                      type="button"
                      onClick={clearDraftFilters}
                      disabled={draftFilterCount === 0}
                      className="text-sm font-extrabold text-text-primary/45 transition-colors hover:text-saffron disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear All
                    </button>
                    <Button
                      type="button"
                      onClick={applyFilters}
                      className="min-h-11 rounded-lg px-8"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron lg:w-36"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={exportBookings}
            className="min-h-11 rounded-lg lg:w-40"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => setReloadKey((current) => current + 1)}
            className="min-h-11 rounded-lg lg:w-36"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {exportError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-text-primary/65">
            Showing {visibleStart}-{visibleEnd} of {totalBookings}
          </p>
          <div className="flex items-center gap-3">
            {isSearchPending && (
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-extrabold text-saffron hover:text-[#c96c1a]"
            >
              Reset filters
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-saffron" />
            <p className="text-sm font-bold text-text-primary/65">
              Loading bookings
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-lg font-extrabold text-text-primary">
              Could not load bookings
            </p>
            <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <ClipboardList className="h-8 w-8 text-text-primary/35" />
            <p className="text-lg font-extrabold text-text-primary">
              No bookings found
            </p>
            <p className="max-w-md text-sm leading-6 text-text-primary/60">
              Try changing search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Pooja</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-text-primary">
                        {booking.bookingNumber}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">
                        {booking.id}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-text-primary">
                        +91 {booking.bookingWhatsappNumber}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-text-primary/45">
                        {booking.user.isWhatsappVerified
                          ? "Verified user"
                          : "Unverified user"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-text-primary">
                        {booking.pooja.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-text-primary/55">
                        {booking.temple.name}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-saffron" />
                        {formatDate(booking.bookingDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">
                      {label(booking.type)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(
                          booking.status,
                        )}`}
                      >
                        {label(booking.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">
                      {booking.latestPaymentStatus
                        ? label(booking.latestPaymentStatus)
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="inline-flex items-center gap-1 text-sm font-extrabold text-saffron">
                        <IndianRupee className="h-4 w-4" />
                        {formatAmount(booking.amount.final).replace("?", "")}
                      </p>
                      {booking.amount.discount > 0 && (
                        <p className="mt-1 text-xs font-semibold text-text-primary/45">
                          Discount {formatAmount(booking.amount.discount)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-text-primary/60">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="motion-arrow-left h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <ChevronRight className="motion-arrow-right h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}