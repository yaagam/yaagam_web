"use client";

import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";
import apiClient from "@/lib/api/axios/axios.instance";

type ReturnStatus = "verifying" | "success" | "error";

type PaymentReturnProps = {
  bookingId: string;
  transactionId: string;
  paymentId: string;
  orderId: string;
  subscriptionId: string;
  signature: string;
  callbackError: string;
};

export function PaymentReturn(props: PaymentReturnProps) {
  const [status, setStatus] = useState<ReturnStatus>("verifying");

  useEffect(() => {
    if (
      props.callbackError ||
      !props.bookingId ||
      !props.transactionId ||
      !props.paymentId ||
      (!props.orderId && !props.subscriptionId) ||
      !props.signature
    ) {
      const timer = window.setTimeout(() => setStatus("error"), 0);
      return () => window.clearTimeout(timer);
    }

    window.history.replaceState(null, "", window.location.pathname);

    const controller = new AbortController();
    apiClient
      .post(
        "/payments/razorpay/verify",
        {
          bookingId: props.bookingId,
          transactionId: props.transactionId,
          razorpay_payment_id: props.paymentId,
          ...(props.orderId && { razorpay_order_id: props.orderId }),
          ...(props.subscriptionId && {
            razorpay_subscription_id: props.subscriptionId,
          }),
          razorpay_signature: props.signature,
        },
        { signal: controller.signal },
      )
      .then(() => setStatus("success"))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("[payment-return] verification failed", error);
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [
    props.bookingId,
    props.callbackError,
    props.orderId,
    props.paymentId,
    props.signature,
    props.subscriptionId,
    props.transactionId,
  ]);

  return (
    <main className="grid min-h-[70svh] place-items-center bg-[#f4f7fb] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
        {status === "verifying" ? (
          <LoaderCircle className="mx-auto h-14 w-14 animate-spin text-[#f59e42]" />
        ) : status === "success" ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        ) : (
          <CircleAlert className="mx-auto h-14 w-14 text-rose-600" />
        )}

        <h1 className="mt-5 text-2xl font-black text-[#10203f]">
          {status === "verifying"
            ? "Verifying your payment"
            : status === "success"
              ? "Payment successful"
              : "Payment verification pending"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {status === "verifying"
            ? "You are back in the browser. Please wait while we securely confirm your payment."
            : status === "success"
              ? "Your payment is confirmed and your pooja booking is scheduled."
              : "We could not confirm the payment immediately. If money was deducted, please check My Poojas before trying again."}
        </p>

        {status !== "verifying" && (
          <Button asChild className="mt-6 h-11 w-full font-bold">
            <Link href={APP_ROUTES.userMyPoojas}>Go to My Poojas</Link>
          </Button>
        )}
      </section>
    </main>
  );
}
