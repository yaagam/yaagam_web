"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, CircleAlert, Clock3, Copy, LoaderCircle,
  LockKeyhole, QrCode, RefreshCw, ShieldCheck, Smartphone, WifiOff, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePaymentCountdown } from "@/hooks/use-payment-countdown";
import { usePaymentSession } from "@/hooks/use-payment-session";
import { trackPaymentEvent } from "@/lib/payment/payment-observability";
import { cn } from "@/lib/utils";
import type { PaymentSession, PaymentStatus } from "@/types/payment";

const statusContent: Record<PaymentStatus, { title: string; message: string; tone: "neutral" | "success" | "danger" }> = {
  loading: { title: "Preparing secure payment", message: "Creating your payment request…", tone: "neutral" },
  pending: { title: "Scan to pay", message: "Open any UPI app and scan the secure QR code.", tone: "neutral" },
  processing: { title: "Confirming payment", message: "Payment received. We’re securely verifying it.", tone: "neutral" },
  success: { title: "Payment successful", message: "Your booking is confirmed.", tone: "success" },
  failed: { title: "Payment didn’t go through", message: "No charge was completed. You can safely try again.", tone: "danger" },
  expired: { title: "QR code expired", message: "Generate a fresh QR code to continue.", tone: "danger" },
  cancelled: { title: "Payment cancelled", message: "This payment request is no longer active.", tone: "danger" },
  retrying: { title: "Refreshing payment", message: "Generating a new secure payment request…", tone: "neutral" },
  subscription_active: { title: "Subscription active", message: "Your recurring pooja plan is now active.", tone: "success" },
  subscription_pending: { title: "Approve AutoPay", message: "Scan the QR and approve the mandate in your UPI app.", tone: "neutral" },
  subscription_cancelled: { title: "Subscription cancelled", message: "The recurring payment mandate has been cancelled.", tone: "danger" },
};

const formatAmount = (value: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function safeBackendImageUrl(value?: string) {
  if (!value || /^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")) return undefined;
  return value.startsWith("/api/backend/")
    ? value
    : `/api/backend${value.startsWith("/") ? "" : "/"}${value}`;
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const content = statusContent[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold",
      content.tone === "success" && "bg-emerald-100 text-emerald-700",
      content.tone === "danger" && "bg-rose-100 text-rose-700",
      content.tone === "neutral" && "bg-amber-100 text-amber-800",
    )}>
      <span className="relative flex h-2 w-2">
        {content.tone === "neutral" && <span className="absolute h-full w-full animate-ping rounded-full bg-amber-500 opacity-50" />}
        <span className={cn("relative h-2 w-2 rounded-full", content.tone === "success" ? "bg-emerald-500" : content.tone === "danger" ? "bg-rose-500" : "bg-amber-500")} />
      </span>
      {status.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}

function Countdown({ expiresAt, serverTime }: { expiresAt?: string; serverTime?: string }) {
  const countdown = usePaymentCountdown(expiresAt, serverTime);
  if (!expiresAt || !serverTime) return <span>Secure session</span>;
  return (
    <span aria-label={`${countdown.minutes} minutes ${countdown.seconds} seconds remaining`}>
      {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
    </span>
  );
}

function PaymentQr({ payload, imageUrl, expired, onDisplayed }: {
  payload?: string; imageUrl?: string; expired: boolean; onDisplayed: () => void;
}) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    if (!payload) return;
    void import("qrcode")
      .then((module) => module.toString(payload, {
        type: "svg", errorCorrectionLevel: "M", margin: 1, width: 288,
        color: { dark: "#10203f", light: "#ffffff" },
      }))
      .then((value) => {
        if (!active) return;
        setSvg(value);
        onDisplayed();
      })
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [payload, onDisplayed]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[17rem] rounded-[1.75rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-200">
      <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl">
        {svg ? (
          <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="Secure payment QR code" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : imageUrl && !failed ? (
          // Backend-owned image fallback. SVG payload is preferred.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Secure payment QR code" className="h-full w-full object-contain" onLoad={onDisplayed} onError={() => setFailed(true)} />
        ) : (
          <div className="text-center text-slate-400">
            <QrCode className="mx-auto h-24 w-24" />
            <p className="mt-3 text-xs font-bold">{failed ? "QR unavailable" : "Waiting for secure QR"}</p>
          </div>
        )}
      </div>
      {expired && (
        <div className="absolute inset-0 grid place-items-center rounded-[1.75rem] bg-white/90 backdrop-blur-sm">
          <div className="text-center"><Clock3 className="mx-auto h-9 w-9 text-rose-500" /><p className="mt-2 text-sm font-extrabold text-slate-900">QR expired</p></div>
        </div>
      )}
      <span className="absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#10203f] px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified payment
      </span>
    </div>
  );
}

function PriceSummary({ session }: { session: PaymentSession }) {
  const details = session.priceBreakdown;
  return (
    <aside className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[#10203f]">Payment summary</h2>
        <LockKeyhole className="h-4 w-4 text-emerald-600" aria-label="Secure" />
      </div>
      <div className="mt-6 space-y-4 text-xs font-semibold text-slate-500">
        <p className="flex justify-between gap-4"><span>Pooja dakshina</span><span className="font-bold text-slate-800">{formatAmount(details.poojaAmount, session.currency)}</span></p>
        {details.offerings.map((item) => (
          <p key={item.offeringId} className="flex justify-between gap-4"><span>{item.nameSnapshot}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span><span className="font-bold text-slate-800">{formatAmount(item.total, session.currency)}</span></p>
        ))}
        {details.dakshinaAmount > 0 && <p className="flex justify-between gap-4"><span>Additional dakshina</span><span className="font-bold text-slate-800">{formatAmount(details.dakshinaAmount, session.currency)}</span></p>}
      </div>
      <div className="my-5 border-t border-dashed border-slate-200" />
      <div className="flex items-end justify-between"><span className="text-xs font-bold text-slate-500">Total</span><span className="text-2xl font-black tracking-tight text-[#10203f]">{formatAmount(details.grandTotal, session.currency)}</span></div>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="flex gap-3 text-[11px] font-semibold leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Payment details are encrypted. Yaagam never stores your UPI PIN.</p>
      </div>
    </aside>
  );
}

export function PaymentExperience({ session, isProcessingPayment, onBack, onComplete }: {
  session: PaymentSession; isProcessingPayment: boolean; onBack: () => void; onComplete: () => void;
}) {
  const payment = usePaymentSession(session);
  const countdown = usePaymentCountdown(payment.snapshot.expiresAt, payment.snapshot.serverTime);
  const completedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const content = statusContent[payment.status];
  const isSuccess = payment.status === "success" || payment.status === "subscription_active";
  const canRetry = ["failed", "expired", "cancelled", "subscription_cancelled"].includes(payment.status);
  const canCancel = ["pending", "processing", "subscription_pending"].includes(payment.status);
  const displayReference = useMemo(() => session.bookingId.slice(-8).toUpperCase(), [session.bookingId]);

  useEffect(() => {
    trackPaymentEvent("payment_started", payment.snapshot.correlationId, { recurring: session.kind === "subscription" });
  }, [payment.snapshot.correlationId, session.kind]);
  useEffect(() => {
    if (!isSuccess || completedRef.current) return;
    completedRef.current = true;
    trackPaymentEvent(session.kind === "subscription" ? "subscription_activation" : "payment_success", payment.snapshot.correlationId);
    const timer = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(timer);
  }, [isSuccess, onComplete, payment.snapshot.correlationId, session.kind]);
  const onQrDisplayed = useMemo(() => () => trackPaymentEvent("qr_displayed", payment.snapshot.correlationId), [payment.snapshot.correlationId]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[#f4f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.11)]">
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl md:px-7">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg text-xs font-extrabold text-slate-600 hover:text-slate-950" aria-label="Go back to booking details"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><LockKeyhole className="h-3.5 w-3.5 text-emerald-600" /> Secure payment</div>
      </header>
      <div className="grid gap-6 p-4 md:p-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#10203f] via-[#162a50] to-[#263c62] px-5 py-7 text-white md:px-10 md:py-9">
          <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#f59e42]/20 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill status={payment.status} />
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs font-bold text-white/90"><Clock3 className="h-3.5 w-3.5 text-[#ffb569]" /><Countdown expiresAt={payment.snapshot.expiresAt} serverTime={payment.snapshot.serverTime} /></span>
            </div>
            <div className="mx-auto mt-7 max-w-lg text-center">
              <h1 ref={(node) => { if (isSuccess) node?.focus(); }} tabIndex={isSuccess ? -1 : undefined} className="text-2xl font-black tracking-tight md:text-3xl">{content.title}</h1>
              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-slate-300">{content.message}</p>
            </div>
            {isSuccess ? (
              <div className="mx-auto mt-10 grid h-56 max-w-sm place-items-center rounded-[1.75rem] border border-emerald-300/20 bg-emerald-400/10">
                <div className="text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-400 text-[#10203f] shadow-[0_0_50px_rgba(52,211,153,.35)]"><CheckCircle2 className="h-11 w-11" /></span><p className="mt-5 text-sm font-extrabold">Redirecting to your booking…</p></div>
              </div>
            ) : (
              <div className="mt-7"><PaymentQr payload={payment.snapshot.qrPayload} imageUrl={safeBackendImageUrl(payment.snapshot.qrImageUrl)} expired={payment.status === "expired" || countdown.expired} onDisplayed={onQrDisplayed} /><div className="mx-auto mt-7 flex max-w-sm items-center justify-center gap-2 text-[11px] font-semibold text-slate-300"><Smartphone className="h-4 w-4 text-[#ffb569]" /> Works with every UPI app</div></div>
            )}
            <div aria-live="polite" className="mx-auto mt-6 max-w-md">
              {!payment.online && <div className="flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-semibold text-amber-100"><WifiOff className="h-4 w-4 shrink-0" /> You’re offline. Verification will resume automatically.</div>}
              {payment.error && payment.online && <div className="flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs font-semibold text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {payment.error.message}</div>}
            </div>
            <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              {canRetry && <Button type="button" disabled={payment.actionPending} onClick={payment.retry} className="h-11 rounded-xl bg-[#f59e42] px-6 font-extrabold text-[#10203f] hover:bg-[#ffb569]">{payment.actionPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Generate new QR</Button>}
              {canCancel && session.publicToken && <Button type="button" variant="ghost" disabled={payment.actionPending} onClick={payment.cancel} className="h-11 rounded-xl px-6 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /> Cancel payment</Button>}
              {!session.publicToken && <Button type="button" disabled={isProcessingPayment} onClick={onComplete} className="h-11 rounded-xl bg-[#f59e42] px-6 font-extrabold text-[#10203f] hover:bg-[#ffb569]">{isProcessingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} I’ve completed payment</Button>}
            </div>
          </div>
        </main>
        <div className="space-y-4">
          <PriceSummary session={session} />
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Booking reference</p>
            <div className="mt-2 flex items-center justify-between gap-3"><span className="font-mono text-sm font-black tracking-wider text-[#10203f]">{displayReference}</span><button type="button" aria-label="Copy booking reference" onClick={async () => { await navigator.clipboard.writeText(displayReference); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button></div>
          </div>
          <p className="px-3 text-center text-[10px] font-semibold leading-4 text-slate-400">Never close your UPI app until the payment is confirmed here.</p>
        </div>
      </div>
    </section>
  );
}
