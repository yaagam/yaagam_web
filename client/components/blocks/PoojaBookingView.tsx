"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { City, State } from "country-state-city";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  Camera,
  Check,
  Heart,
  Home,
  Lock,
  Loader2,
  Landmark,
  MapPin,
  Navigation,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import { LanguageSelector } from "@/components/ui/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES, PLACEHOLDER_ROUTE } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { sendOtpApi } from "@/lib/api/user/send-otp.api";
import { verifyOtpApi } from "@/lib/api/user/verify-otp.api";
import { useToast } from "@/components/providers/ToastProvider";
import {
  isClientLoggedIn,
  markClientLoggedIn,
} from "@/lib/auth/client-session";
import type { UserRole } from "@/lib/auth/roles";
import { getErrorMessage } from "@/lib/utils";

type PoojaBookingViewProps = {
  poojaId: string;
  plan?: string;
};

type DbLanguage = PoojaTranslation["language"];
type CheckoutStep = "details" | "payment" | "success";
type PaymentMode = "autopay" | "qr" | "card" | "netbanking";

type PaymentSession = {
  bookingId: string;
  transactionId: string;
  keyId: string;
  amount: number;
  currency: string;
  gatewayMode: "order" | "subscription" | "autopay-qr";
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  gatewayReference: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayCheckoutOptions,
    ) => RazorpayCheckoutInstance;
  }
}

type CurrentLocationAddress = {
  latitude: number;
  longitude: number;
  streetName: string;
  state?: string;
  pincode?: string;
  district?: string;
};

type BookingForm = {
  name: string;
  whatsappNumber: string;
  state: string;
  nakshatra: string;
  naal: string;
  specialRequest: string;
  wantsPrasad: boolean;
  houseNo: string;
  streetName: string;
  pincode: string;
  district: string;
  phoneNumber: string;
};

const southIndianStates = new Set([
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Lakshadweep",
  "Puducherry",
  "Tamil Nadu",
  "Telangana",
]);

const nakshatras = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashirsha",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const naalOptions = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const indianStates = State.getStatesOfCountry("IN");
const SESSION_EXPIRED_ERROR = "Session Expired";

const steps = [
  "Enter Details",
  "Payment",
  "Booking Confirmed",
  "Pooja Scheduled",
  "Pooja Completed",
];

const trustItems = [
  {
    title: "100% Secure",
    text: "Your data is safe with us",
    icon: Lock,
  },
  {
    title: "Trusted Temples",
    text: "Verified & authentic temples",
    icon: MapPin,
  },
  {
    title: "Photos & Videos",
    text: "Delivered on WhatsApp",
    icon: Camera,
  },
  {
    title: "Devotion First",
    text: "Pure rituals, divine blessings",
    icon: Heart,
  },
];

const razorpayCheckoutScriptUrl =
  "https://checkout.razorpay.com/v1/checkout.js";

function getApiUrl(path: string, apiBaseUrl: string) {
  const normalizedBaseUrl = apiBaseUrl.endsWith("/")
    ? apiBaseUrl
    : `${apiBaseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, "");

  return new URL(normalizedPath, normalizedBaseUrl);
}

function getBrowserPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Current location is not supported on this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12000,
    });
  });
}

function isCurrentLocationAddress(
  value: unknown,
): value is CurrentLocationAddress {
  if (!value || typeof value !== "object") return false;

  const address = value as Partial<CurrentLocationAddress>;

  return (
    typeof address.latitude === "number" &&
    typeof address.longitude === "number" &&
    typeof address.streetName === "string"
  );
}

async function getCurrentLocationAddress(): Promise<CurrentLocationAddress> {
  console.info("[location] requesting browser position");
  const position = await getBrowserPosition();
  const latitude = Number(position.coords.latitude.toFixed(6));
  const longitude = Number(position.coords.longitude.toFixed(6));
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    console.error("[location] NEXT_PUBLIC_API_URL is not configured");
    throw new Error("Location service is not configured.");
  }

  const requestUrl = getApiUrl("addresses/reverse-geocode", apiBaseUrl);
  requestUrl.searchParams.set("latitude", latitude.toString());
  requestUrl.searchParams.set("longitude", longitude.toString());

  console.info("[location] calling backend reverse geocode", {
    latitude,
    longitude,
    url: requestUrl.toString(),
  });

  const response = await fetch(requestUrl, {
    method: "GET",
    credentials: "include",
  });

  const responseData = await response.json().catch((parseError: unknown) => {
    console.error("[location] unable to parse backend response", parseError);
    return null;
  });
  const data =
    responseData && typeof responseData === "object" && "data" in responseData
      ? (responseData as { data?: unknown }).data
      : responseData;

  console.info("[location] backend reverse geocode response", {
    ok: response.ok,
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Unable to fetch address from current location."),
    );
  }

  const address = data as {
    roadName?: unknown;
    formattedAddress?: unknown;
    state?: unknown;
    pincode?: unknown;
    district?: unknown;
  };
  const streetName =
    typeof address.roadName === "string" && address.roadName
      ? address.roadName
      : typeof address.formattedAddress === "string"
        ? address.formattedAddress
        : "";

  const mappedAddress: CurrentLocationAddress = {
    latitude,
    longitude,
    streetName,
    state: typeof address.state === "string" ? address.state : undefined,
    pincode: typeof address.pincode === "string" ? address.pincode : undefined,
    district:
      typeof address.district === "string" ? address.district : undefined,
  };

  if (!isCurrentLocationAddress(mappedAddress)) {
    console.error("[location] backend returned invalid address", data);
    throw new Error("Location service returned an invalid address.");
  }

  return mappedAddress;
}

function isPaymentSession(value: unknown): value is PaymentSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<PaymentSession>;

  return (
    typeof session.bookingId === "string" &&
    typeof session.transactionId === "string" &&
    typeof session.keyId === "string" &&
    typeof session.amount === "number" &&
    typeof session.currency === "string" &&
    typeof session.gatewayReference === "string" &&
    (session.gatewayMode === "order" ||
      session.gatewayMode === "subscription" ||
      session.gatewayMode === "autopay-qr")
  );
}

async function createRazorpayCheckoutSession(payload: unknown) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) throw new Error("Payment service is not configured.");

  const response = await fetch(
    new URL("/bookings/checkout-session", apiBaseUrl),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  const responseData = await response.json().catch(() => null);
  const data =
    responseData && typeof responseData === "object" && "data" in responseData
      ? (responseData as { data?: unknown }).data
      : responseData;

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Unable to create Razorpay checkout session."),
    );
  }

  if (!isPaymentSession(data)) {
    throw new Error("Payment service returned an invalid checkout session.");
  }

  return data;
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${razorpayCheckoutScriptUrl}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay Checkout.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = razorpayCheckoutScriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

const defaultForm: BookingForm = {
  name: "",
  whatsappNumber: "",
  state: "",
  nakshatra: "",
  naal: "",
  specialRequest: "",
  wantsPrasad: true,
  houseNo: "",
  streetName: "",
  pincode: "",
  district: "",
  phoneNumber: "",
};

function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[] | undefined,
  language: DbLanguage,
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
    null
  );
}

function getApiImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return "";
  if (/^(?:https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith("/")) return imageUrl;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return imageUrl;

  try {
    return new URL(imageUrl, apiBaseUrl).toString();
  } catch {
    return imageUrl;
  }
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDiscountedAmount(
  baseAmount: string | number,
  discount: number | null | undefined,
) {
  const amount = Number(baseAmount);

  if (Number.isNaN(amount)) return baseAmount;
  if (!discount) return amount;

  return Math.max(0, Math.round(amount - (amount * discount) / 100));
}

function getNextPoojaDate(dayName: string) {
  const targetDay = naalOptions.findIndex(
    (day) => day.toLowerCase() === dayName.toLowerCase(),
  );

  if (targetDay === -1) return dayName;

  const today = new Date();
  const daysUntil = (targetDay - today.getDay() + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(nextDate);
}

function selectClassName(value: string) {
  return [
    "mt-1 h-10 w-full rounded-md border border-[#d9e0ed] bg-white px-4 text-[12px] font-semibold outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/10",
    value ? "text-[#061b4d]" : "text-[#667399]",
  ].join(" ");
}

function getStateIsoCode(stateName: string) {
  return indianStates.find((state) => state.name === stateName)?.isoCode ?? "";
}

function FieldLabel({
  children,
  required,
}: Readonly<{ children: React.ReactNode; required?: boolean }>) {
  return (
    <span className="text-[12px] font-extrabold text-[#061b4d]">
      {children} {required && <span className="text-[#ef7d1a]">*</span>}
    </span>
  );
}

export function PoojaBookingView({ poojaId, plan }: PoojaBookingViewProps) {
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [form, setForm] = useState<BookingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("details");
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<PaymentMode | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsWhatsappVerified(isClientLoggedIn());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPooja() {
      setIsLoading(true);
      setError("");

      try {
        const nextPooja = await getPoojaDetailsApi(poojaId);
        if (isActive) setPooja(nextPooja);
      } catch (loadError: unknown) {
        if (!isActive) return;
        setError(getErrorMessage(loadError, "Could not load pooja."));
        setPooja(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [poojaId]);

  const summary = useMemo(() => {
    if (!pooja) return null;

    const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
      pooja.translations,
      "EN",
    );
    const templeTranslation = getLocalizedTranslation<TempleTranslation>(
      pooja.temple?.translations,
      "EN",
    );
    const selectedPlan = plan === "weekly" ? "weekly" : "single";
    const amount =
      selectedPlan === "weekly"
        ? getDiscountedAmount(pooja.baseAmount, pooja.weeklyDiscount)
        : getDiscountedAmount(pooja.baseAmount, pooja.normalDiscount);
    const image = getApiImageUrl(pooja.imageUrls?.[0] ?? "/nava_graha.png");

    return {
      title: poojaTranslation?.name ?? "Pooja",
      templeName: templeTranslation?.name ?? "Temple",
      templePlace: templeTranslation?.place ?? "",
      poojaDay: pooja.poojaDay,
      nextDate: getNextPoojaDate(pooja.poojaDay),
      planName: selectedPlan === "weekly" ? "Weekly Plan" : "Single Day Plan",
      amount,
      image,
    };
  }, [plan, pooja]);

  const selectedPlan = plan === "weekly" ? "weekly" : "single";
  const activeStepIndex =
    checkoutStep === "details" ? 0 : checkoutStep === "payment" ? 1 : 2;
  const isSouthState = southIndianStates.has(form.state);
  const naalFieldLabel = isSouthState ? "Naal" : "Gothra";
  const stateIsoCode = getStateIsoCode(form.state);
  const districts = useMemo(() => {
    if (!stateIsoCode) return [];

    return Array.from(
      new Set(
        City.getCitiesOfState("IN", stateIsoCode).map((city) => city.name),
      ),
    ).sort((first, second) => first.localeCompare(second));
  }, [stateIsoCode]);

  const bookingPayload = useMemo(
    () => ({
      poojaId,
      plan: selectedPlan,
      devotee: {
        name: form.name,
        whatsappNumber: form.whatsappNumber,
        state: form.state,
        nakshatra: form.nakshatra,
        naal: form.naal,
        specialRequest: form.specialRequest,
      },
      address: form.wantsPrasad
        ? {
            houseNo: form.houseNo,
            streetName: form.streetName,
            pincode: form.pincode,
            district: form.district,
            phoneNumber: form.phoneNumber,
            location: form.streetName.startsWith("Current location:")
              ? form.streetName.replace("Current location:", "").trim()
              : undefined,
          }
        : null,
    }),
    [form, poojaId, selectedPlan],
  );

  async function getRoleAfterLogin(fallbackRole: UserRole | null) {
    if (fallbackRole) return fallbackRole;

    try {
      return await refreshAuthSession();
    } catch {
      return null;
    }
  }

  function handleWhatsAppNumberChange(value: string) {
    setForm((current) => ({
      ...current,
      whatsappNumber: value.replace(/\D/g, "").slice(0, 10),
    }));
    setOtp("");
    setOtpSent(false);
    setOtpError("");
    if (!isClientLoggedIn()) setIsWhatsappVerified(false);
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setOtpError("");
  }

  async function requestBookingOtp() {
    if (isClientLoggedIn()) {
      setIsWhatsappVerified(true);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.whatsappNumber)) {
      setOtpError("Enter a valid 10-digit WhatsApp number.");
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");

    try {
      await sendOtpApi(form.whatsappNumber);
      setOtpSent(true);
      setOtp("");
      showToast("success", "OTP sent on WhatsApp");
    } catch (sendError: unknown) {
      setOtpError(
        getErrorMessage(sendError, "Unable to send OTP. Please try again."),
      );
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function verifyBookingOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const authResult = await verifyOtpApi(otp);
      const role = await getRoleAfterLogin(authResult.role);

      if (!role) throw new Error("Unable to complete login. Please try again.");

      markClientLoggedIn(role);
      setIsWhatsappVerified(true);
      setOtpSent(false);
      setOtp("");
      showToast("success", "WhatsApp verified successfully");
    } catch (verifyError: unknown) {
      const message = getErrorMessage(
        verifyError,
        "Unable to verify OTP. Please try again.",
      );

      if (message === SESSION_EXPIRED_ERROR) {
        setOtpSent(false);
        setOtp("");
        setOtpError("Enter number again");
        return;
      }

      setOtpError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  }
  function updateField<K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUseCurrentLocation() {
    setIsDetectingLocation(true);
    setLocationError("");

    try {
      const location = await getCurrentLocationAddress();
      setForm((current) => ({
        ...current,
        streetName: location.streetName,
        pincode: location.pincode ?? current.pincode,
        district: location.district ?? current.district,
      }));
      showToast("success", "Current location added");
    } catch (locationRequestError: unknown) {
      console.error(
        "[location] use current location failed",
        locationRequestError,
      );
      setLocationError(
        getErrorMessage(
          locationRequestError,
          "Unable to get current location.",
        ),
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }
  async function handleContinueToPayment() {
    if (!isWhatsappVerified || isCreatingPayment) return;

    setIsCreatingPayment(true);

    try {
      const nextSession = await createRazorpayCheckoutSession(bookingPayload);
      setPaymentSession(nextSession);
      setSelectedPaymentMode(selectedPlan === "weekly" ? "autopay" : "qr");
      setCheckoutStep("payment");
      showToast("success", "Checkout session created");
    } catch (createError: unknown) {
      showToast(
        "error",
        getErrorMessage(
          createError,
          "Unable to create booking. Please try again.",
        ),
      );
    } finally {
      setIsCreatingPayment(false);
    }
  }

  async function verifyRazorpayPayment(response: RazorpaySuccessResponse) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBaseUrl)
      throw new Error("Payment verification service is not configured.");

    const verifyResponse = await fetch(
      new URL("/payments/razorpay/verify", apiBaseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: paymentSession?.bookingId,
          transactionId: paymentSession?.transactionId,
          ...response,
        }),
      },
    );

    const responseData = await verifyResponse.json().catch(() => null);
    const data =
      responseData && typeof responseData === "object" && "data" in responseData
        ? (responseData as { data?: unknown }).data
        : responseData;

    if (!verifyResponse.ok) {
      throw new Error(getErrorMessage(data, "Payment verification failed."));
    }
  }

  async function handleRazorpayPayment() {
    if (!paymentSession || isProcessingPayment) return;

    if (
      paymentSession.gatewayMode === "autopay-qr" &&
      !paymentSession.subscriptionId &&
      !paymentSession.orderId
    ) {
      showToast(
        "success",
        "AutoPay QR shown. Waiting for backend payment status.",
      );
      return;
    }

    setIsProcessingPayment(true);

    try {
      await loadRazorpayCheckout();

      if (!window.Razorpay)
        throw new Error("Razorpay Checkout is unavailable.");

      const checkout = new window.Razorpay({
        key: paymentSession.keyId,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        name: "Yaagam",
        description: `${summary.title} - ${summary.planName}`,
        image: "/logo_png.png",
        order_id: paymentSession.orderId,
        subscription_id: paymentSession.subscriptionId,
        prefill: paymentSession.prefill ?? {
          name: form.name,
          contact: form.whatsappNumber,
        },
        notes: {
          bookingId: paymentSession.bookingId,
          transactionId: paymentSession.transactionId,
          plan: selectedPlan,
        },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment(response);
            setCheckoutStep("success");
            showToast("success", "Payment successful");
          } catch (verifyError: unknown) {
            showToast(
              "error",
              getErrorMessage(verifyError, "Payment verification failed."),
            );
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessingPayment(false),
        },
      });

      checkout.open();
    } catch (paymentError: unknown) {
      setIsProcessingPayment(false);
      showToast(
        "error",
        getErrorMessage(paymentError, "Unable to open Razorpay Checkout."),
      );
    }
  }

  function handleBackToDetails() {
    setCheckoutStep("details");
  }
  function handleStateChange(value: string) {
    setForm((current) => ({
      ...current,
      state: value,
      district: "",
      naal: "",
    }));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-4 bg-[#fbfbfd] text-[#061b4d]/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">Loading booking details</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-[#061b4d]">
          Could not load booking
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Pooja not found."}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.poojaDetails(poojaId)}>Back to pooja</Link>
        </Button>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#061b4d]">
      <style jsx global>{`
        body > header,
        body > footer {
          display: none !important;
        }
      `}</style>

      <header className="border-b border-[#dde2ec] bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <Link
            href={APP_ROUTES.home}
            aria-label="Yaagam home"
            className="block"
          >
            <Image src="/logo_png.png" width={72} height={72} alt="Yaagam" />
          </Link>
          <LanguageSelector className="h-9 rounded-full border border-[#d8deea] px-2 text-[12px] font-extrabold text-[#061b4d]" />
        </div>
      </header>

      <section className="mx-auto max-w-[1160px] px-5 pt-10">
        <div className="grid grid-cols-5 items-start gap-5">
          {steps.map((step, index) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center"
            >
              {index < steps.length - 1 && (
                <span className="absolute left-1/2 top-3.5 h-px w-full bg-[#e8ebf2]" />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold ${
                  index === 0
                    ? "bg-[#ef7d1a] text-white"
                    : "bg-[#f0f2f7] text-[#9aa3b8]"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`mt-2 text-[10px] font-extrabold ${
                  index <= activeStepIndex ? "text-[#ef7d1a]" : "text-[#7a849d]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1160px] gap-12 px-5 pb-12 pt-20 lg:grid-cols-[620px_320px] lg:justify-between">
        {checkoutStep === "details" ? (
          <form
            className="space-y-5"
            data-payload={JSON.stringify(bookingPayload)}
          >
            <div>
              <h1 className="text-[18px] font-extrabold leading-5 text-[#061b4d]">
                Enter Devotee Details
              </h1>
              <p className="mt-1 text-[12px] font-semibold text-[#7d86a0]">
                Please provide the details below to book your pooja
              </p>
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>Name</FieldLabel>
                <Input
                  className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>

              <label className="block">
                <FieldLabel required>WhatsApp Number</FieldLabel>
                <Input
                  className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                  inputMode="tel"
                  name="whatsappNumber"
                  placeholder="Enter your WhatsApp number"
                  value={form.whatsappNumber}
                  onChange={(event) =>
                    handleWhatsAppNumberChange(event.target.value)
                  }
                />
              </label>
            </div>

            <div className="space-y-3 rounded-md border border-[#d7f0dd] bg-[#f0fff4] px-4 py-3">
              <div className="flex items-center justify-between gap-5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#20b15a] text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-[#0d7d3c]">
                      {isWhatsappVerified
                        ? "WhatsApp Verified"
                        : "Verify WhatsApp Number"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#51a46c]">
                      {isWhatsappVerified
                        ? "You are logged in and ready to continue."
                        : "We will send an OTP to your WhatsApp number for verification."}
                    </p>
                  </div>
                </div>
                {!isWhatsappVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSendingOtp}
                    onClick={requestBookingOtp}
                    className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingOtp
                      ? "Sending..."
                      : otpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                  </Button>
                )}
              </div>

              {!isWhatsappVerified && otpSent && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    className="h-10 rounded-md border-[#d9e0ed] px-4 text-center text-[16px] font-extrabold tracking-[0.35em] shadow-none placeholder:text-[#667399]"
                    inputMode="numeric"
                    name="otp"
                    placeholder="------"
                    value={otp}
                    onChange={(event) => handleOtpChange(event.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={isVerifyingOtp}
                    onClick={verifyBookingOtp}
                    className="h-10 rounded-md bg-[#ef7d1a] px-5 text-[12px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify & Login"}
                  </Button>
                </div>
              )}

              {otpError && (
                <p className="text-[10px] font-bold text-red-600">{otpError}</p>
              )}
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>State</FieldLabel>
                <select
                  className={selectClassName(form.state)}
                  name="state"
                  value={form.state}
                  onChange={(event) => handleStateChange(event.target.value)}
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>Nakshatra</FieldLabel>
                <select
                  className={selectClassName(form.nakshatra)}
                  name="nakshatra"
                  value={form.nakshatra}
                  onChange={(event) =>
                    updateField("nakshatra", event.target.value)
                  }
                >
                  <option value="">Select Nakshatra</option>
                  {nakshatras.map((nakshatra) => (
                    <option key={nakshatra} value={nakshatra}>
                      {nakshatra}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel required>{naalFieldLabel}</FieldLabel>
                {isSouthState ? (
                  <select
                    className={selectClassName(form.naal)}
                    name="naal"
                    value={form.naal}
                    onChange={(event) =>
                      updateField("naal", event.target.value)
                    }
                  >
                    <option value="">Select Naal</option>
                    {naalOptions.map((naal) => (
                      <option key={naal} value={naal}>
                        {naal}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    name="naal"
                    placeholder="Enter Gothra"
                    value={form.naal}
                    onChange={(event) =>
                      updateField("naal", event.target.value)
                    }
                  />
                )}
              </label>

              <label className="block">
                <FieldLabel>
                  Special Request{" "}
                  <span className="text-[#7d86a0]">(Optional)</span>
                </FieldLabel>
                <Input
                  className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                  name="specialRequest"
                  placeholder="Any specific request for the pooja"
                  value={form.specialRequest}
                  onChange={(event) =>
                    updateField("specialRequest", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="pt-3">
              <p className="text-[12px] font-extrabold text-[#ef7d1a]">
                Do you want to receive prasad for the Pooja?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("wantsPrasad", true)}
                  className={`h-9 rounded-full px-4 text-[12px] font-extrabold ${
                    form.wantsPrasad
                      ? "bg-[#ef7d1a] text-white"
                      : "border border-[#ef7d1a] bg-white text-[#ef7d1a]"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => updateField("wantsPrasad", false)}
                  className={`h-9 rounded-full px-4 text-[12px] font-extrabold ${
                    form.wantsPrasad
                      ? "border border-[#ef7d1a] bg-white text-[#ef7d1a]"
                      : "bg-[#ef7d1a] text-white"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {form.wantsPrasad && (
              <div className="grid gap-x-7 gap-y-4 pt-3 md:grid-cols-2">
                <label className="block">
                  <FieldLabel>House No.</FieldLabel>
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    name="houseNo"
                    placeholder="Enter your house no / Floor no.."
                    value={form.houseNo}
                    onChange={(event) =>
                      updateField("houseNo", event.target.value)
                    }
                  />
                </label>

                <div className="flex items-end justify-center md:justify-start">
                  <div className="mb-1 space-y-1">
                    <button
                      type="button"
                      disabled={isDetectingLocation}
                      onClick={handleUseCurrentLocation}
                      className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#ef7d1a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Navigation className="h-6 w-6" />
                      {isDetectingLocation
                        ? "Getting location..."
                        : "Use current location"}
                    </button>
                    {locationError && (
                      <p className="max-w-52 text-[10px] font-bold leading-4 text-red-600">
                        {locationError}
                      </p>
                    )}
                  </div>
                </div>

                <label className="block">
                  <FieldLabel required>
                    Road Name/ Street Name / landmark
                  </FieldLabel>
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    name="streetName"
                    placeholder="Enter Road Name / Street Na..."
                    value={form.streetName}
                    onChange={(event) =>
                      updateField("streetName", event.target.value)
                    }
                  />
                </label>

                <label className="block">
                  <FieldLabel required>Pincode</FieldLabel>
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    inputMode="numeric"
                    name="pincode"
                    placeholder="Enter your pincode"
                    value={form.pincode}
                    onChange={(event) =>
                      updateField("pincode", event.target.value)
                    }
                  />
                </label>

                <label className="block">
                  <FieldLabel required>District</FieldLabel>
                  <select
                    className={selectClassName(form.district)}
                    name="district"
                    value={form.district}
                    onChange={(event) =>
                      updateField("district", event.target.value)
                    }
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <FieldLabel required>Phone Number</FieldLabel>
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    inputMode="tel"
                    name="phoneNumber"
                    placeholder="Enter your mobile number"
                    value={form.phoneNumber}
                    onChange={(event) =>
                      updateField("phoneNumber", event.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </form>
        ) : checkoutStep === "payment" ? (
          <section className="space-y-5 rounded-lg border border-[#edf0f6] bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-[18px] font-extrabold leading-6 text-[#061b4d]">
                Complete Payment
              </h1>
              <p className="mt-1 text-[12px] font-semibold text-[#7d86a0]">
                Razorpay dev-mode payment screen. The same flow works in
                production with live Razorpay keys.
              </p>
            </div>
            <div className="rounded-md bg-[#fff4e8] p-4 text-[12px] font-bold text-[#6f7890]">
              <p className="flex justify-between gap-4">
                <span>Booking ID</span>
                <span className="text-[#061b4d]">
                  {paymentSession?.bookingId}
                </span>
              </p>
              <p className="mt-2 flex justify-between gap-4">
                <span>Transaction ID</span>
                <span className="text-[#061b4d]">
                  {paymentSession?.transactionId}
                </span>
              </p>
              {selectedPlan === "weekly" && (
                <p className="mt-2 flex justify-between gap-4">
                  <span>Razorpay AutoPay QR ID</span>
                  <span className="text-right text-[#061b4d]">
                    {paymentSession?.razorpayAutoPayQrId}
                  </span>
                </p>
              )}
            </div>
            {selectedPlan === "weekly" ? (
              <div className="rounded-lg border border-dashed border-[#ef7d1a]/40 bg-[#fffaf4] p-6 text-center">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-md border border-[#ef7d1a]/30 bg-white text-[#ef7d1a]">
                  <QrCode className="h-24 w-24" />
                </div>
                <h2 className="mt-5 text-[16px] font-extrabold text-[#061b4d]">
                  Google Pay AutoPay QR
                </h2>
                <p className="mt-2 text-[12px] font-semibold leading-5 text-[#7d86a0]">
                  Weekly plan shows only the backend-provided AutoPay QR id.
                  Later this will map to Razorpay AutoPay.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { id: "qr", title: "QR / UPI", icon: QrCode },
                  { id: "card", title: "Card", icon: CreditCard },
                  { id: "netbanking", title: "Netbanking", icon: Landmark },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPaymentMode === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        setSelectedPaymentMode(method.id as PaymentMode)
                      }
                      className={`rounded-lg border p-4 text-left transition ${isSelected ? "border-[#ef7d1a] bg-[#fff4e8] text-[#ef7d1a]" : "border-[#edf0f6] bg-white text-[#061b4d] hover:border-[#ef7d1a]/50"}`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="mt-3 block text-[13px] font-extrabold">
                        {method.title}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold text-[#7d86a0]">
                        Razorpay checkout option
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2 md:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToDetails}
                className="h-11 rounded-lg border-[#d9e0ed] text-[13px] font-extrabold"
              >
                Back to Details
              </Button>
              <Button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleRazorpayPayment}
                className="h-11 flex-1 rounded-lg bg-[#ef7d1a] text-[13px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessingPayment
                  ? "Opening Razorpay..."
                  : "Proceed with Razorpay"}{" "}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-[#d7f0dd] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#effff4] text-[#149149]">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-[22px] font-extrabold text-[#061b4d]">
              Booking Confirmed
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[13px] font-semibold leading-6 text-[#7d86a0]">
              Your booking and transaction are successful. This screen is shown
              only after backend payment verification succeeds.
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-md bg-[#f8fafc] p-4 text-left text-[12px] font-bold text-[#6f7890]">
              <p className="flex justify-between gap-4">
                <span>Booking ID</span>
                <span className="text-[#061b4d]">
                  {paymentSession?.bookingId}
                </span>
              </p>
              <p className="mt-2 flex justify-between gap-4">
                <span>Transaction ID</span>
                <span className="text-[#061b4d]">
                  {paymentSession?.transactionId}
                </span>
              </p>
            </div>
            <Button
              asChild
              className="mt-7 h-11 rounded-lg bg-[#ef7d1a] px-6 text-[13px] font-extrabold text-white hover:bg-[#d96e13]"
            >
              <Link href={APP_ROUTES.poojas}>View More Poojas</Link>
            </Button>
          </section>
        )}

        <div className="space-y-5">
          <aside className="rounded-lg border border-[#edf0f6] bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-extrabold text-[#061b4d]">
              Booking Summary
            </h2>
            <div className="mt-4 grid grid-cols-[72px_1fr] gap-4">
              <div className="relative h-[72px] overflow-hidden rounded-sm bg-[#f4f4f4]">
                <Image
                  src={summary.image}
                  alt={summary.title}
                  fill
                  unoptimized={summary.image.startsWith("http")}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="line-clamp-2 text-[12px] font-extrabold leading-4 text-[#061b4d]">
                  {summary.title}
                </h3>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-[#6b748c]">
                  {[summary.templeName, summary.templePlace]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-[12px] font-bold text-[#6f7890]">
              <p className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#8f98ad]" />
                  Pooja Day
                </span>
                <span className="text-right text-[#061b4d]">
                  {summary.nextDate}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4 text-[#8f98ad]" />
                  Plan type
                </span>
                <span className="text-[#ef7d1a]">{summary.planName}</span>
              </p>
            </div>

            <div className="my-5 border-t border-[#edf0f6]" />
            <p className="flex items-center justify-between text-[12px] font-extrabold text-[#061b4d]">
              Amount
              <span className="text-lg text-[#ef7d1a]">
                Rs.{formatAmount(summary.amount)}
              </span>
            </p>

            <div className="mt-4 rounded-md bg-[#fff4e8] p-4">
              <p className="text-[12px] font-extrabold text-[#ef7d1a]">
                What is Included
              </p>
              <div className="mt-3 space-y-2 text-[10px] font-bold text-[#4f5972]">
                {form.wantsPrasad && (
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                    Prasadam
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                  Photos & Video on WhatsApp
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-md bg-[#effff4] p-4 text-[10px] font-bold text-[#149149]">
              <p className="flex items-center gap-2 text-[12px] font-extrabold">
                <ShieldCheck className="h-6 w-4" />
                Secure Booking
              </p>
              <p className="mt-1 text-[#55a36d]">
                Your details are encrypted and 100% secure with us.
              </p>
            </div>
          </aside>

          <div>
            <p className="mb-7 flex items-center gap-2 text-[10px] font-semibold text-[#8a92a5]">
              <Lock className="h-3.5 w-3.5" />
              Your information is secure and will only be used for pooja
              purpose.
            </p>
            <Button
              type="button"
              disabled={
                !isWhatsappVerified ||
                isCreatingPayment ||
                checkoutStep !== "details"
              }
              onClick={handleContinueToPayment}
              className="h-12 w-full rounded-lg bg-[#ef7d1a] text-[13px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!isWhatsappVerified
                ? "Verify WhatsApp to Continue"
                : isCreatingPayment
                  ? "Creating Booking..."
                  : checkoutStep === "details"
                    ? "Continue to Payment"
                    : "Payment In Progress"}
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[760px] grid-cols-2 gap-6 px-5 pb-12 pt-2 md:grid-cols-4">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#edf0f6] bg-white text-[#ef7d1a]">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-[12px] font-extrabold text-[#061b4d]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[10px] font-semibold text-[#8a92a5]">
                  {item.text}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="border-t border-[#dfe4ee] bg-white">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-4 px-5 py-5 text-[10px] font-semibold text-[#7d86a0] md:flex-row">
          <p>© 2026 Yaagam Applications Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href={PLACEHOLDER_ROUTE}>Terms of Use</Link>
            <Link href={PLACEHOLDER_ROUTE}>Refund & Cancellation Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
