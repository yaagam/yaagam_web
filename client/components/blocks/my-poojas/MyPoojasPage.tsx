"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  TicketCheck,
} from "lucide-react";

import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { Button } from "@/components/ui/button";
import {
  MY_POOJA_FALLBACK_IMAGES,
  MY_POOJA_STATUS_STYLES,
  MY_POOJAS_PAGE_SIZE,
} from "@/constants/my-poojas.const";
import { APP_ROUTES } from "@/constants/route.const";
import { removePlanTerm } from "@/lib/option-label";
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

  return (
    <article className="grid gap-4 rounded-lg border border-[#edf0f6] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.9fr)_140px] md:items-center md:p-5">
      <div className="grid min-w-0 grid-cols-[88px_1fr] gap-4">
        <div className="relative h-20 overflow-hidden rounded-md bg-[#f2f4f8]">
          <Image
            src={imageUrl}
            alt={booking.pooja.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 pt-1">
          <h2 className="text-[15px] font-semibold leading-5 text-[#202a3d]">
            {booking.pooja.name}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-[12px] font-medium leading-5 text-[#16447f]">
            <PublicSvgIcon
              name="temple"
              width={16}
              height={16}
              className="mt-0.5 h-4 w-4 shrink-0 scale-x-150 object-contain [&_path]:fill-saffron [&_path]:stroke-saffron"
            />
            <span className="min-w-0 text-wrap-safe">
              {booking.temple.name}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#587095]">
            Booking ID: {booking.bookingNumber}
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-[12px] font-medium text-[#16447f] sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#8b95aa]" />
          <span className="text-[#587095]">Pooja Day</span>
          <span className="text-wrap-safe text-[#16447f]">
            {formatDate(booking.poojaDate)}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#8b95aa]" />
          <span className="text-[#587095]">Pooja type</span>
          <span className="text-wrap-safe text-[#16447f]">
            {removePlanTerm(booking.displayType)}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 md:flex-col md:items-start md:justify-center">
        <StatusBadge status={booking.displayStatus} />
        <div>
          <p className="text-[11px] font-medium text-[#587095]">Amount</p>
          <p className="text-[15px] font-semibold text-[#ef7d1a]">
            {formatCurrency(booking.amount.final)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-2 rounded-md border-[#ef7d1a] bg-[#fff8ef] px-3 font-extrabold text-[#ef7d1a] hover:bg-[#ffedd8]"
        >
          <Link href={APP_ROUTES.poojaTracking(booking.bookingNumber)}>
            <FileText className="h-4 w-4" />
            More details
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function MyPoojasPage() {
  const [bookings, setBookings] = useState<MyPoojaItem[]>([]);
  const [meta, setMeta] = useState<MyPoojasMeta | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const hiddenLoginRootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadBookings = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMyPoojasApi({
        page: nextPage,
        limit: MY_POOJAS_PAGE_SIZE,
      });
      setBookings((current) => {
        if (nextPage === 1) return response.items;

        const existingReferences = new Set(
          current.map((booking) => booking.reference),
        );
        return [
          ...current,
          ...response.items.filter(
            (booking) => !existingReferences.has(booking.reference),
          ),
        ];
      });
      setMeta(response.meta);
    } catch {
      setError("Unable to load your poojas. Please try again.");
      setBookings([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function checkAuth() {
      if (isClientLoggedIn()) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        await loadBookings(1);
        return;
      }

      try {
        await refreshAuthSession();
        if (!isActive) return;
        setIsAuthenticated(true);
        await loadBookings(1);
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
      if (loggedIn) void loadBookings(1);
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);

    return () => {
      isActive = false;
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChange,
      );
    };
  }, [loadBookings]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !isAuthenticated || !meta?.hasNextPage || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadBookings(meta.page + 1);
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isAuthenticated, isLoading, loadBookings, meta]);

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
              void loadBookings(1);
            }}
          />
        </div>

        {isCheckingAuth || (isLoading && bookings.length === 0) ? (
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
                void loadBookings(1);
              }}
            />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-white p-8 text-center text-sm font-medium text-red-600 shadow-sm">
            {error}
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="space-y-4">
              {bookings.map((booking, index) => (
                <MyPoojaRow
                  key={booking.reference}
                  booking={booking}
                  index={index}
                />
              ))}
            </div>
            <div
              ref={loadMoreRef}
              className="flex min-h-20 items-center justify-center text-[#ef7d1a]"
              aria-live="polite"
            >
              {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
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
            <Button asChild className="mt-5">
              <Link href={APP_ROUTES.poojas}>Book a Pooja</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
