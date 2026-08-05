"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  ImageIcon,
  Landmark,
  Loader2,
  Search,
  TicketCheck,
} from "lucide-react";

import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MY_POOJA_FALLBACK_IMAGES,
  MY_POOJA_FILTERS,
  MY_POOJA_STATUS_STYLES,
  MY_POOJAS_PAGE_SIZE,
  type StatusFilter,
} from "@/constants/my-poojas.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  getMyPoojasApi,
  type MyPoojaDisplayStatus,
  type MyPoojaItem,
  type MyPoojasMeta,
} from "@/lib/api/user/my-poojas.api";
import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import {
  AUTH_SESSION_CHANGED_EVENT,
  isClientLoggedIn,
} from "@/lib/auth/client-session";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) return "To be scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getImageUrl(booking: MyPoojaItem, index: number) {
  return (
    booking.pooja.imageUrls[0] ||
    MY_POOJA_FALLBACK_IMAGES[index % MY_POOJA_FALLBACK_IMAGES.length]
  );
}

function StatusBadge({ status }: { status: MyPoojaDisplayStatus }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-[11px] font-semibold ${MY_POOJA_STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function MyPoojaRow({
  booking,
  index,
}: {
  booking: MyPoojaItem;
  index: number;
}) {
  const imageUrl = getImageUrl(booking, index);
  const isCompleted = booking.displayStatus === "Completed";

  return (
    <article className="grid gap-4 rounded-lg border border-[#edf0f6] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.9fr)_140px] md:items-center md:p-5">
      <div className="grid min-w-0 grid-cols-[88px_1fr] gap-4">
        <div className="relative h-20 overflow-hidden rounded-md bg-[#f2f4f8]">
          <Image
            src={imageUrl}
            alt={booking.pooja.name}
            fill
            unoptimized={imageUrl.startsWith("http")}
            className="object-cover"
          />
        </div>
        <div className="min-w-0 pt-1">
          <h2 className="text-[15px] font-semibold leading-5 text-[#202a3d]">
            {booking.pooja.name}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-[12px] font-medium leading-5 text-[#16447f]">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 text-wrap-safe">
              {booking.temple.name}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#587095]">
            Booking ID: {booking.bookingNumber}
          </p>
          {isCompleted && booking.completionNote && (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-[#f3fff7] px-3 py-2 text-[11px] font-medium leading-5 text-[#178a45]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-wrap-safe">{booking.completionNote}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-[12px] font-medium text-[#16447f] sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#8b95aa]" />
          <span className="text-[#587095]">Pooja Day</span>
          <span className="text-wrap-safe text-[#16447f]">
            {formatDate(booking.bookingDate)}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#8b95aa]" />
          <span className="text-[#587095]">Pooja type</span>
          <span className="text-wrap-safe text-[#16447f]">
            {booking.displayType}
          </span>
        </p>
        {booking.latestPaymentStatus && (
          <p className="flex items-center gap-2 sm:col-span-2 md:col-span-1 lg:col-span-2">
            <TicketCheck className="h-4 w-4 text-[#8b95aa]" />
            <span className="text-[#587095]">Payment</span>
            <span className="text-wrap-safe text-[#16447f]">
              {booking.latestPaymentStatus}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 md:flex-col md:items-start md:justify-center">
        <StatusBadge status={booking.displayStatus} />
        <div>
          <p className="text-[11px] font-medium text-[#587095]">Amount</p>
          <p className="text-[15px] font-semibold text-[#ef7d1a]">
            {formatCurrency(booking.amount.final)}
          </p>
        </div>
        {isCompleted && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="h-9 rounded-md border-[#ef7d1a] text-[#ef7d1a] disabled:opacity-70"
          >
            <ImageIcon className="h-4 w-4" />
            View Media
          </Button>
        )}
      </div>
    </article>
  );
}

export function MyPoojasPage() {
  const [bookings, setBookings] = useState<MyPoojaItem[]>([]);
  const [meta, setMeta] = useState<MyPoojasMeta | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const hiddenLoginRootRef = useRef<HTMLDivElement>(null);

  const loadBookings = useCallback(
    async (nextPage: number, nextSearch: string) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getMyPoojasApi({
          page: nextPage,
          limit: MY_POOJAS_PAGE_SIZE,
          search: nextSearch.trim() || undefined,
        });
        setBookings(response.items);
        setMeta(response.meta);
      } catch {
        setError("Unable to load your poojas. Please try again.");
        setBookings([]);
        setMeta(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isActive = true;

    async function checkAuth() {
      if (isClientLoggedIn()) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        await loadBookings(1, search);
        return;
      }

      try {
        await refreshAuthSession();
        if (!isActive) return;
        setIsAuthenticated(true);
        await loadBookings(1, search);
      } catch {
        if (!isActive) return;
        setIsAuthenticated(false);
        window.setTimeout(() => {
          hiddenLoginRootRef.current?.querySelector("button")?.click();
        }, 120);
      } finally {
        if (isActive) setIsCheckingAuth(false);
      }
    }

    void checkAuth();

    function handleSessionChange() {
      const loggedIn = isClientLoggedIn();
      setIsAuthenticated(loggedIn);
      if (loggedIn) void loadBookings(1, search);
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);

    return () => {
      isActive = false;
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChange,
      );
    };
  }, [loadBookings, search]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      void loadBookings(1, search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadBookings, search]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      return activeFilter === "all" || booking.displayStatus === activeFilter;
    });
  }, [activeFilter, bookings]);

  function handlePageChange(nextPage: number) {
    void loadBookings(nextPage, search);
  }

  return (
    <main className="flex-1 bg-[#f8f9fb]">
      <section className="mx-auto min-h-[620px] w-full max-w-[1180px] px-4 py-12 md:px-6 md:py-16">
        <div className="mb-10">
          <h1 className="text-[28px] font-extrabold leading-9 text-[#202a3d] md:text-[32px]">
            My Poojas
          </h1>
          <p className="mt-2 text-[13px] font-medium text-[#16447f]">
            Track and view all your booked poojas.
          </p>
        </div>

        <div ref={hiddenLoginRootRef} className="sr-only" aria-hidden="true">
          <WhatsAppLoginModal
            triggerContent={<span>Verify WhatsApp</span>}
            triggerClassName="sr-only"
            onLoginSuccess={() => {
              setIsAuthenticated(true);
              void loadBookings(1, search);
            }}
          />
        </div>

        <div className="mb-5 flex flex-col gap-4 border-b border-[#e5e9f1] pb-0 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 gap-6 overflow-x-auto">
            {MY_POOJA_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`min-h-11 shrink-0 border-b-2 px-1 text-[12px] font-semibold transition-colors ${activeFilter === filter.id ? "border-[#ef7d1a] text-[#ef7d1a]" : "border-transparent text-[#16447f] hover:text-[#ef7d1a]"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pb-3 md:pb-2">
            <label className="relative block w-full min-w-0 md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa4b6]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search poojas..."
                className="h-10 rounded-md border-[#dce2ec] pl-10 text-[12px] shadow-none"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-md border-[#ffd8ba] px-4 text-[12px] font-semibold text-[#ef7d1a] hover:bg-[#fff4e8]"
              onClick={() =>
                setActiveFilter(activeFilter === "all" ? "Scheduled" : "all")
              }
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {isCheckingAuth || isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-[#edf0f6] bg-white text-[#ef7d1a]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-lg border border-[#edf0f6] bg-white p-8 text-center shadow-sm">
            <TicketCheck className="mx-auto h-10 w-10 text-[#ef7d1a]" />
            <h2 className="mt-4 text-lg font-extrabold text-[#202a3d]">
              Verify WhatsApp to view your poojas
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-[#68758d]">
              Your booked poojas are connected to your verified WhatsApp number.
            </p>
            <WhatsAppLoginModal
              triggerContent={<span>Verify WhatsApp</span>}
              triggerClassName="mt-5"
              onLoginSuccess={() => {
                setIsAuthenticated(true);
                void loadBookings(1, search);
              }}
            />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-white p-8 text-center text-sm font-medium text-red-600 shadow-sm">
            {error}
          </div>
        ) : filteredBookings.length > 0 ? (
          <>
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <MyPoojaRow
                  key={booking.reference}
                  booking={booking}
                  index={index}
                />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-lg border border-[#edf0f6] bg-white px-4 py-3 text-[12px] font-medium text-[#587095] sm:flex-row">
                <span>
                  Page {meta.page} of {meta.totalPages} - {meta.total} bookings
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
                    className="h-9 rounded-md"
                  >
                    <ChevronLeft className="motion-arrow-left h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => handlePageChange(meta.page + 1)}
                    className="h-9 rounded-md"
                  >
                    Next
                    <ChevronRight className="motion-arrow-right h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-[#edf0f6] bg-white p-8 text-center shadow-sm">
            <TicketCheck className="mx-auto h-10 w-10 text-[#ef7d1a]" />
            <h2 className="mt-4 text-lg font-extrabold text-[#202a3d]">
              No poojas found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-[#68758d]">
              Your bookings will appear here after payment confirmation.
            </p>
            <Button
              asChild
              className="mt-5 rounded-full bg-[#ef7d1a] px-5 font-extrabold text-white hover:bg-[#d96e13]"
            >
              <Link href={APP_ROUTES.poojas}>Book a Pooja</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
