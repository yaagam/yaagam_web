"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  ChevronDown,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type PaymentMode = "autopay" | "qr" | "card" | "netbanking";

type PaymentSession = {
  bookingId: string;
  transactionId: string;
  amount: number;
  currency: string;
  gatewayMode: "order" | "subscription" | "autopay-qr";
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  gatewayReference: string;
  priceBreakdown: {
    poojaBaseAmount: number;
    poojaDiscountAmount: number;
    poojaAmount: number;
    offerings: Array<{
      offeringId: string;
      nameSnapshot: string;
      priceSnapshot: number;
      quantity: number;
      total: number;
    }>;
    offeringTotal: number;
    dakshinaAmount: number;
    grandTotal: number;
    currency: "INR";
  };
};

type BookingPaymentText = {
  completePayment: string;
  paymentSubtitle: string;
  bookingId: string;
  transactionId: string;
  razorpayAutoPayQrId: string;
  googlePayAutoPayQr: string;
  weeklyQrText: string;
  qrUpi: string;
  card: string;
  netbanking: string;
  razorpayCheckoutOption: string;
  backToDetails: string;
  openingRazorpay: string;
  proceedWithRazorpay: string;
  bookingSummary: string;
  poojaPrice: string;
  selectedOfferings: string;
  offeringTotal: string;
  dakshina: string;
  grandTotal: string;
  totalDakshina: string;
  pujaDakshina: string;
  additionalDakshina: string;
  currencyPrefix: string;
};

type BookingPaymentPageProps = {
  paymentSession: PaymentSession | null;
  selectedPlan: "single" | "weekly";
  selectedPaymentMode: PaymentMode | null;
  isProcessingPayment: boolean;
  text: BookingPaymentText;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onBack: () => void;
  onComplete: () => void;
};

function getPaymentReference(session: PaymentSession, mode: PaymentMode) {
  if (mode === "autopay") {
    return (
      session.razorpayAutoPayQrId ??
      session.subscriptionId ??
      session.orderId ??
      session.gatewayReference
    );
  }

  return session.orderId ?? session.gatewayReference;
}

async function createPaymentQrDataUrl(reference: string) {
  const QRCode = await import("qrcode");

  return QRCode.toDataURL(reference, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: {
      dark: "#ef7d1a",
      light: "#ffffff",
    },
  });
}

function formatBackendAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function BookingPaymentPage({
  paymentSession,
  selectedPlan,
  selectedPaymentMode,
  isProcessingPayment,
  text,
  onPaymentModeChange,
  onBack,
  onComplete,
}: BookingPaymentPageProps) {
  const [paymentQrDataUrl, setPaymentQrDataUrl] = useState("");
  const [paymentQrError, setPaymentQrError] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const paymentReference = useMemo(() => {
    if (!paymentSession) return "";
    if (!selectedPaymentMode) {
      return paymentSession.orderId ?? paymentSession.gatewayReference;
    }

    return getPaymentReference(paymentSession, selectedPaymentMode);
  }, [paymentSession, selectedPaymentMode]);

  useEffect(() => {
    let isActive = true;

    async function generatePaymentQr() {
      if (!paymentSession || !selectedPaymentMode) {
        setPaymentQrDataUrl("");
        setPaymentQrError("");
        return;
      }

      const reference = getPaymentReference(
        paymentSession,
        selectedPaymentMode,
      );

      if (!reference) {
        setPaymentQrDataUrl("");
        setPaymentQrError("Payment reference is missing.");
        return;
      }

      setIsGeneratingQr(true);
      setPaymentQrError("");

      try {
        const nextQrDataUrl = paymentSession.qrImageUrl
          ? paymentSession.qrImageUrl
          : await createPaymentQrDataUrl(reference);

        if (isActive) setPaymentQrDataUrl(nextQrDataUrl);
      } catch (qrError: unknown) {
        console.error("[payment] unable to generate QR", qrError);
        if (isActive) {
          setPaymentQrDataUrl("");
          setPaymentQrError("Unable to generate payment QR.");
        }
      } finally {
        if (isActive) setIsGeneratingQr(false);
      }
    }

    void generatePaymentQr();

    return () => {
      isActive = false;
    };
  }, [paymentSession, selectedPaymentMode]);

  return (
    <section className="space-y-5 rounded-lg border border-[#edf0f6] bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-[18px] font-extrabold leading-6 text-[#061b4d]">
          {text.completePayment}
        </h1>
        <p className="mt-1 text-[12px] font-semibold text-[#7d86a0]">
          {text.paymentSubtitle}
        </p>
      </div>

      {paymentSession && (
        <details className="group overflow-hidden rounded-xl bg-[#f4f4f4]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[13px] font-extrabold text-[#061b4d] marker:content-none">
            <span className="inline-flex min-w-0 items-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="truncate">
                {text.totalDakshina} - {"\u20B9"}
                {formatBackendAmount(paymentSession.priceBreakdown.grandTotal)}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mx-4 space-y-3 border-t border-dashed border-[#d9dce2] pb-4 pt-3 text-[12px] font-semibold text-[#657087]">
            <p className="flex items-center justify-between gap-4">
              <span>{text.pujaDakshina}</span>
              <span className="text-[#25324b]">
                {"\u20B9"}
                {formatBackendAmount(paymentSession.priceBreakdown.poojaAmount)}
              </span>
            </p>

            <p className="flex items-center justify-between gap-4">
              <span>{text.additionalDakshina}</span>
              <span className="text-[#25324b]">
                {"\u20B9"}
                {formatBackendAmount(
                  paymentSession.priceBreakdown.dakshinaAmount,
                )}
              </span>
            </p>

            {paymentSession.priceBreakdown.offerings.map((offering) => (
              <p
                key={offering.offeringId}
                className="flex items-start justify-between gap-4"
              >
                <span>
                  {offering.nameSnapshot}
                  {offering.quantity > 0 ? ` x ${offering.quantity}` : ""}
                </span>
                <span className="shrink-0 text-[#25324b]">
                  {"\u20B9"}
                  {formatBackendAmount(offering.total)}
                </span>
              </p>
            ))}

            <p className="flex items-center justify-between gap-4 border-t border-dashed border-[#d9dce2] pt-3 font-extrabold text-[#25324b]">
              <span>{text.totalDakshina}</span>
              <span>
                {"\u20B9"}
                {formatBackendAmount(paymentSession.priceBreakdown.grandTotal)}
              </span>
            </p>
          </div>
        </details>
      )}

      <div className="rounded-md bg-[#fff4e8] p-4 text-[12px] font-bold text-[#6f7890]">
        <p className="flex justify-between gap-4">
          <span>{text.bookingId}</span>
          <span className="break-all text-right text-[#061b4d]">
            {paymentSession?.bookingId}
          </span>
        </p>
        <p className="mt-2 flex justify-between gap-4">
          <span>{text.transactionId}</span>
          <span className="break-all text-right text-[#061b4d]">
            {paymentSession?.transactionId}
          </span>
        </p>
        {paymentSession && (
          <p className="mt-2 flex justify-between gap-4">
            <span>
              {selectedPlan === "weekly"
                ? text.razorpayAutoPayQrId
                : text.razorpayCheckoutOption}
            </span>
            <span className="break-all text-right text-[#061b4d]">
              {paymentReference}
            </span>
          </p>
        )}
      </div>

      {selectedPlan === "single" && (
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { id: "qr" as const, title: text.qrUpi, icon: QrCode },
            { id: "card" as const, title: text.card, icon: CreditCard },
            {
              id: "netbanking" as const,
              title: text.netbanking,
              icon: Landmark,
            },
          ].map((method) => {
            const Icon = method.icon;
            const isSelected = selectedPaymentMode === method.id;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onPaymentModeChange(method.id)}
                className={`rounded-lg border p-4 text-left transition ${isSelected ? "border-[#ef7d1a] bg-[#fff4e8] text-[#ef7d1a]" : "border-[#edf0f6] bg-white text-[#061b4d] hover:border-[#ef7d1a]/50"}`}
              >
                <Icon className="h-6 w-6" />
                <span className="mt-3 block text-[13px] font-extrabold">
                  {method.title}
                </span>
                <span className="mt-1 block text-[10px] font-semibold text-[#7d86a0]">
                  {text.razorpayCheckoutOption}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {paymentSession && selectedPaymentMode ? (
        <div className="rounded-lg border border-dashed border-[#ef7d1a]/40 bg-[#fffaf4] p-6 text-center">
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-md border border-[#ef7d1a]/30 bg-white p-3 text-[#ef7d1a]">
            {isGeneratingQr ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : paymentQrDataUrl ? (
              <Image
                src={paymentQrDataUrl}
                alt={
                  selectedPaymentMode === "autopay"
                    ? text.googlePayAutoPayQr
                    : text.qrUpi
                }
                width={168}
                height={168}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="h-24 w-24" />
            )}
          </div>
          <h2 className="mt-5 text-[16px] font-extrabold text-[#061b4d]">
            {selectedPaymentMode === "autopay"
              ? text.googlePayAutoPayQr
              : selectedPaymentMode === "card"
                ? text.card
                : selectedPaymentMode === "netbanking"
                  ? text.netbanking
                  : text.qrUpi}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[12px] font-semibold leading-5 text-[#7d86a0]">
            {selectedPaymentMode === "autopay"
              ? text.weeklyQrText
              : "Scan this QR or use the backend payment reference shown above to complete the selected payment mode."}
          </p>
          {paymentQrError && (
            <p className="mt-2 text-[11px] font-bold text-red-600">
              {paymentQrError}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#d9e0ed] bg-[#f8fafc] p-6 text-center text-[12px] font-bold text-[#7d86a0]">
          Select a payment mode to generate the backend payment QR.
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 md:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 rounded-lg border-[#d9e0ed] text-[13px] font-extrabold"
        >
          {text.backToDetails}
        </Button>
        <Button
          type="button"
          disabled={
            isProcessingPayment ||
            isGeneratingQr ||
            !paymentSession ||
            !selectedPaymentMode
          }
          onClick={onComplete}
          className="h-11 flex-1 rounded-lg bg-[#ef7d1a] text-[13px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingPayment
            ? text.openingRazorpay
            : text.proceedWithRazorpay}{" "}
          <ArrowRight className="motion-arrow-right h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
