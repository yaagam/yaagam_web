"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { normalizeWhatsappNumber } from "@/lib/phone";

import { Button } from "@/components/ui/button";
import { usePaymentCountdown } from "@/hooks/use-payment-countdown";
import apiClient from "@/lib/api/axios/axios.instance";
import { usePaymentSession } from "@/hooks/use-payment-session";
import { trackPaymentEvent } from "@/lib/payment/payment-observability";
import { cn } from "@/lib/utils";
import type { PaymentSession, PaymentStatus } from "@/types/payment";

const statusContent: Record<
  PaymentStatus,
  { title: string; message: string; tone: "neutral" | "success" | "danger" }
> = {
  loading: {
    title: "Preparing secure payment",
    message: "Creating your payment request…",
    tone: "neutral",
  },
  pending: {
    title: "Scan to pay",
    message: "Open any UPI app and scan the secure QR code.",
    tone: "neutral",
  },
  processing: {
    title: "Confirming payment",
    message: "Payment received. We’re securely verifying it.",
    tone: "neutral",
  },
  success: {
    title: "Payment successful",
    message: "Your booking is confirmed.",
    tone: "success",
  },
  failed: {
    title: "Payment didn’t go through",
    message: "No charge was completed. You can safely try again.",
    tone: "danger",
  },
  expired: {
    title: "QR code expired",
    message: "Generate a fresh QR code to continue.",
    tone: "danger",
  },
  cancelled: {
    title: "Payment cancelled",
    message: "This payment request is no longer active.",
    tone: "danger",
  },
  retrying: {
    title: "Refreshing payment",
    message: "Generating a new secure payment request…",
    tone: "neutral",
  },
  subscription_active: {
    title: "Subscription active",
    message: "Your recurring pooja plan is now active.",
    tone: "success",
  },
  subscription_pending: {
    title: "Approve AutoPay",
    message: "Open Razorpay Checkout to register your weekly payment mandate.",
    tone: "neutral",
  },
  subscription_cancelled: {
    title: "Subscription cancelled",
    message: "The recurring payment mandate has been cancelled.",
    tone: "danger",
  },
};

const formatAmount = (value: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

type RazorpayResult = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => { open(): void };
};

function loadRazorpayCheckout() {
  if ((window as RazorpayWindow).Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("checkout_load_failed")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("checkout_load_failed"));
    document.body.appendChild(script);
  });
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const content = statusContent[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold",
        content.tone === "success" && "bg-emerald-100 text-emerald-700",
        content.tone === "danger" && "bg-rose-100 text-rose-700",
        content.tone === "neutral" && "bg-amber-100 text-amber-800",
      )}
    >
      <span className="relative flex h-2 w-2">
        {content.tone === "neutral" && (
          <span className="absolute h-full w-full animate-ping rounded-full bg-amber-500 opacity-50" />
        )}
        <span
          className={cn(
            "relative h-2 w-2 rounded-full",
            content.tone === "success"
              ? "bg-emerald-500"
              : content.tone === "danger"
                ? "bg-rose-500"
                : "bg-amber-500",
          )}
        />
      </span>
      {status.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}

function Countdown({
  expiresAt,
  serverTime,
}: {
  expiresAt?: string;
  serverTime?: string;
}) {
  const countdown = usePaymentCountdown(expiresAt, serverTime);
  if (!expiresAt || !serverTime) return <span>Secure session</span>;
  return (
    <span
      aria-label={`${countdown.minutes} minutes ${countdown.seconds} seconds remaining`}
    >
      {String(countdown.minutes).padStart(2, "0")}:
      {String(countdown.seconds).padStart(2, "0")}
    </span>
  );
}

function PriceSummary({ session }: { session: PaymentSession }) {
  const details = session.priceBreakdown;
  return (
    <aside className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#10203f]">
          Payment summary
        </h2>
        <LockKeyhole className="h-4 w-4 text-emerald-600" aria-label="Secure" />
      </div>
      <div className="mt-6 space-y-4 text-xs font-semibold text-slate-500">
        <p className="flex justify-between gap-4">
          <span>
            Pooja dakshina
            {details.devoteeCount && details.devoteeCount > 1
              ? ` (${formatAmount(details.poojaUnitAmount ?? details.poojaAmount, session.currency)} � ${details.devoteeCount} devotees)`
              : ""}
          </span>
          <span className="font-bold text-slate-800">
            {formatAmount(details.poojaAmount, session.currency)}
          </span>
        </p>
        {details.offerings.map((item) => (
          <p key={item.offeringSlug} className="flex justify-between gap-4">
            <span>
              {item.nameSnapshot}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span className="font-bold text-slate-800">
              {formatAmount(item.total, session.currency)}
            </span>
          </p>
        ))}
{" "}
        {details.dakshinaAmount > 0 && (
          <p className="flex justify-between gap-4">
            <span>Additional dakshina</span>
            <span className="font-bold text-slate-800">
              {formatAmount(details.dakshinaAmount, session.currency)}
            </span>
          </p>
        )}
      </div>
      <div className="my-5 border-t border-dashed border-slate-200" />
      <div className="flex items-end justify-between">
        <span className="text-xs font-medium text-slate-500">Total</span>
        <span className="text-2xl font-black tracking-tight text-[#10203f]">
          {formatAmount(details.grandTotal, session.currency)}
        </span>
      </div>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="flex gap-3 text-[11px] font-semibold leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Payment details are encrypted. Yaagam never stores your UPI PIN.
        </p>
      </div>
    </aside>
  );
}

export function PaymentExperience({
  session,
  isProcessingPayment,
  onBack,
  onExpired,
  onComplete,
}: {
  session: PaymentSession;
  isProcessingPayment: boolean;
  onBack: () => void;
  onExpired?: () => void;
  onComplete: () => void;
}) {
  const payment = usePaymentSession(session);
  const countdown = usePaymentCountdown(
    payment.snapshot.expiresAt,
    payment.snapshot.serverTime,
  );
  const completedRef = useRef(false);
  const checkoutOpenedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const isSubscription = session.kind === "subscription";
  const content =
    !isSubscription && isMobile && payment.status === "pending"
      ? {
          title: "Pay with UPI",
          message: "Choose your preferred UPI app to complete the payment.",
          tone: "neutral" as const,
        }
      : statusContent[payment.status];
  const isSuccess =
    payment.status === "success" || payment.status === "subscription_active";
  const displayReference = useMemo(
    () => session.bookingReference.slice(-8).toUpperCase(),
    [session.bookingReference],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    trackPaymentEvent("payment_started", payment.snapshot.correlationId, {
      recurring: session.kind === "subscription",
    });
  }, [payment.snapshot.correlationId, session.kind]);
  useEffect(() => {
    if (!isSuccess || completedRef.current) return;
    completedRef.current = true;
    trackPaymentEvent(
      session.kind === "subscription"
        ? "subscription_activation"
        : "payment_success",
      payment.snapshot.correlationId,
    );
    const timer = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(timer);
  }, [isSuccess, onComplete, payment.snapshot.correlationId, session.kind]);
  useEffect(() => {
    if (
      isSubscription ||
      (payment.status !== "expired" && !countdown.expired)
    ) {
      return;
    }

    const timer = window.setTimeout(() => (onExpired ?? onBack)(), 1500);
    return () => window.clearTimeout(timer);
  }, [countdown.expired, isSubscription, onBack, onExpired, payment.status]);
  async function openRazorpayCheckout() {
    const checkoutReference = isSubscription
      ? session.subscriptionId
      : session.orderId;
    if (!session.keyId || !checkoutReference) {
      setCheckoutError(
        "Payment details are unavailable. Please go back and try again.",
      );
      return;
    }
    const rawContact = session.prefill?.contact?.trim() ?? "";
    const contact = rawContact
      ? rawContact.startsWith("+")
        ? rawContact
        : normalizeWhatsappNumber(rawContact)
      : undefined;
    const callbackUrl = new URL(
      "/api/payments/razorpay/callback",
      window.location.origin,
    );
    callbackUrl.searchParams.set("bookingReference", session.bookingReference);
    callbackUrl.searchParams.set(
      "transactionReference",
      session.transactionReference,
    );
    callbackUrl.searchParams.set("lang", document.documentElement.lang);
    setCheckoutError("");
    setCheckoutPending(true);
    try {
      await loadRazorpayCheckout();
      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!Razorpay) throw new Error("checkout_load_failed");
      const checkout = new Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: "Yaagam",
        description: isSubscription
          ? "Weekly pooja AutoPay"
          : "Pooja booking payment",
        prefill: {
          name: session.prefill?.name,
          contact,
        },
        readonly: { contact: true, name: true },
        hidden: { contact: true, email: true },
        callback_url: callbackUrl.toString(),
        redirect: true,
        ...(isSubscription
          ? { subscription_id: checkoutReference }
          : { order_id: checkoutReference }),
        handler: async (result: RazorpayResult) => {
          await apiClient.post("/payments/razorpay/verify", {
            bookingReference: session.bookingReference,
            transactionReference: session.transactionReference,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_order_id: result.razorpay_order_id,
            razorpay_subscription_id: result.razorpay_subscription_id,
            razorpay_signature: result.razorpay_signature,
          });
          onComplete();
        },
        modal: { ondismiss: () => setCheckoutPending(false) },
        theme: { color: "#f59e42" },
      });
      checkout.open();
    } catch {
      setCheckoutError(
        "Razorpay Checkout could not be opened. Please check your connection and try again.",
      );
      setCheckoutPending(false);
    }
  }
  useEffect(() => {
    const checkoutReference = isSubscription
      ? session.subscriptionId
      : session.orderId;
    if (checkoutOpenedRef.current || !session.keyId || !checkoutReference) {
      return;
    }

    checkoutOpenedRef.current = true;
    void openRazorpayCheckout();
    // Open Checkout once when the newly-created payment session is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscription, session.keyId, session.orderId, session.subscriptionId]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[#f4f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.11)]">
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl md:px-7">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950"
          aria-label="Go back to offerings"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" /> Secure
          payment
        </div>
      </header>
      <div className="grid gap-6 p-4 md:p-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#10203f] via-[#162a50] to-[#263c62] px-5 py-7 text-white md:px-10 md:py-9">
          <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#f59e42]/20 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill status={payment.status} />
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs font-medium text-white/90">
                <Clock3 className="h-3.5 w-3.5 text-[#ffb569]" />
                <Countdown
                  expiresAt={payment.snapshot.expiresAt}
                  serverTime={payment.snapshot.serverTime}
                />
              </span>
            </div>
            <div className="mx-auto mt-7 max-w-lg text-center">
              <h1
                ref={(node) => {
                  if (isSuccess) node?.focus();
                }}
                tabIndex={isSuccess ? -1 : undefined}
                className="text-2xl font-black tracking-tight md:text-3xl"
              >
                {content.title}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-slate-300">
                {content.message}
              </p>
            </div>
            {isSuccess ? (
              <div className="mx-auto mt-10 grid h-56 max-w-sm place-items-center rounded-[1.75rem] border border-emerald-300/20 bg-emerald-400/10">
                <div className="text-center">
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-400 text-[#10203f] shadow-[0_0_50px_rgba(52,211,153,.35)]">
                    <CheckCircle2 className="h-11 w-11" />
                  </span>
                  <p className="mt-5 text-sm font-semibold">
                    Redirecting to your booking…
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-7">
                <div className="mx-auto max-w-md rounded-[1.75rem] border border-white/15 bg-white/10 p-7 text-center">
                  <ShieldCheck className="mx-auto h-14 w-14 text-green-500" />
                  <h2 className="mt-5 text-lg font-extrabold">
                    {isSubscription
                      ? "Register your weekly mandate"
                      : "Complete your secure payment"}
                  </h2>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-300">
                    Razorpay Checkout lets you choose UPI, cards, and other
                    available payment methods securely.
                  </p>
                </div>
              </div>
            )}
            <div aria-live="polite" className="mx-auto mt-6 max-w-md">
              {!payment.online && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-semibold text-amber-100">
                  <WifiOff className="h-4 w-4 shrink-0" /> You’re offline.
                  Verification will resume automatically.
                </div>
              )}
              {payment.error && payment.online && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs font-semibold text-rose-100">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{" "}
                  {payment.error.message}
                </div>
              )}
              {checkoutError && (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs font-semibold text-rose-100">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{" "}
                  {checkoutError}
                </div>
              )}
            </div>
            <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              {
                <Button
                  type="button"
                  disabled={
                    checkoutPending || !session.keyId || !session.subscriptionId
                  }
                  onClick={openRazorpayCheckout}
                  className="h-11 rounded-xl bg-[#f59e42] px-6 font-extrabold text-[#10203f] hover:bg-[#ffb569]"
                >
                  {checkoutPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}{" "}
                  {isSubscription
                    ? "Authorize AutoPay"
                    : "Open Razorpay Checkout"}
                </Button>
              }
              {!isSubscription && !session.publicToken && (
                <Button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={onComplete}
                  className="h-11 rounded-xl bg-[#f59e42] px-6 font-extrabold text-[#10203f] hover:bg-[#ffb569]"
                >
                  {isProcessingPayment ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}{" "}
                  I’ve completed payment
                </Button>
              )}
            </div>
          </div>
        </main>
        <div className="space-y-4">
          <PriceSummary session={session} />
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Booking reference
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-black tracking-wider text-[#10203f]">
                {displayReference}
              </span>
              <button
                type="button"
                aria-label="Copy booking reference"
                onClick={async () => {
                  await navigator.clipboard.writeText(displayReference);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="px-3 text-center text-[10px] font-semibold leading-4 text-slate-400">
            Never close your UPI app until the payment is confirmed here.
          </p>
        </div>
      </div>
    </section>
  );
}
