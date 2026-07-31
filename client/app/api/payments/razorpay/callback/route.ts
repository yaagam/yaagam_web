import { NextRequest, NextResponse } from "next/server";

import { defaultLanguage, isLanguage } from "@/translations/locales";

const RAZORPAY_ID = /^[A-Za-z0-9_-]{1,128}$/;
const RAZORPAY_SIGNATURE = /^[a-f0-9]{64}$/i;
const INTERNAL_ID = /^[A-Za-z0-9_-]{1,128}$/;

function valid(value: FormDataEntryValue | null, pattern: RegExp) {
  return typeof value === "string" && pattern.test(value) ? value : "";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const bookingId = valid(
    request.nextUrl.searchParams.get("bookingId"),
    INTERNAL_ID,
  );
  const transactionId = valid(
    request.nextUrl.searchParams.get("transactionId"),
    INTERNAL_ID,
  );
  const requestedLanguage = request.nextUrl.searchParams.get("lang") ?? "";
  const language = isLanguage(requestedLanguage)
    ? requestedLanguage
    : defaultLanguage;
  const paymentId = valid(form.get("razorpay_payment_id"), RAZORPAY_ID);
  const orderId = valid(form.get("razorpay_order_id"), RAZORPAY_ID);
  const subscriptionId = valid(
    form.get("razorpay_subscription_id"),
    RAZORPAY_ID,
  );
  const signature = valid(form.get("razorpay_signature"), RAZORPAY_SIGNATURE);

  const returnUrl = new URL(`/${language}/payment/return`, request.url);
  returnUrl.searchParams.set("bookingId", bookingId);
  returnUrl.searchParams.set("transactionId", transactionId);
  returnUrl.searchParams.set("razorpay_payment_id", paymentId);
  returnUrl.searchParams.set("razorpay_order_id", orderId);
  returnUrl.searchParams.set("razorpay_subscription_id", subscriptionId);
  returnUrl.searchParams.set("razorpay_signature", signature);

  if (
    !bookingId ||
    !transactionId ||
    !paymentId ||
    (!orderId && !subscriptionId) ||
    !signature
  ) {
    returnUrl.searchParams.set("callback_error", "invalid_response");
  }

  const response = NextResponse.redirect(returnUrl, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
