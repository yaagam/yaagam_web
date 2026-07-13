"use client";

import axios from "axios";
import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useEffect, useMemo, useState } from "react";
import { City } from "country-state-city";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Home,
  Lock,
  Loader2,
  Navigation,
  ShieldCheck,
  X,
} from "lucide-react";

import { LanguageSelector } from "@/components/ui/language-selector";
import { FooterLegalSection } from "@/components/layout/Footer";
import { BookingPaymentPage } from "@/components/blocks/pooja-booking/BookingPaymentPage";
import { BookingSuccessModal } from "@/components/blocks/pooja-booking/BookingSuccessModal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BOOKING_TRUST_ITEM_ICONS,
  DB_LANGUAGE_BY_APP_LANGUAGE,
  DEFAULT_BOOKING_FORM,
  INDIAN_STATES,
  NAALS_SOUTH,
  SESSION_EXPIRED_ERROR,
  SOUTH_INDIAN_STATES,
  SOUTH_INDIAN_STATE_CODES,
} from "@/constants/pooja-booking.const";
import { APP_ROUTES } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import apiClient, { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { sendOtpApi } from "@/lib/api/user/send-otp.api";
import { verifyOtpApi } from "@/lib/api/user/verify-otp.api";
import { useToast } from "@/components/providers/ToastProvider";
import {
  getClientWhatsappNumber,
  isClientLoggedIn,
  isClientRefreshStale,
  markClientLoggedIn,
  markClientWhatsappNumber,
} from "@/lib/auth/client-session";
import { useAuthStore } from "@/lib/auth/auth.store";
import type { UserRole } from "@/lib/auth/roles";
import { bookingCopy } from "@/translations/booking-copy";
import { getPoojaDateLabel } from "@/lib/pooja-date";
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
  keyId?: string;
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

type CurrentLocationAddress = {
  latitude: number;
  longitude: number;
  houseNo?: string;
  streetName: string;
  state?: string;
  pincode?: string;
  district?: string;
};

type BookingForm = {
  name: string;
  whatsappNumber: string;
  state: string;
  naal: string;
  sankalpa: string;
  wantsPrasad: boolean;
  houseNo: string;
  streetName: string;
  pincode: string;
  district: string;
  phoneNumber: string;
};

type AddressSnapshot = {
  houseNo?: string;
  streetName: string;
  pincode: string;
  district: string;
  phoneNumber: string;
  state?: string;
  location?: string;
};

type SavedAddress = Partial<AddressSnapshot> & {
  roadName?: string;
  houseNumber?: string;
};

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
    houseNo?: unknown;
    houseNumber?: unknown;
    roadName?: unknown;
    formattedAddress?: unknown;
    state?: unknown;
    pincode?: unknown;
    district?: unknown;
  };
  const houseNo =
    typeof address.houseNo === "string" && address.houseNo
      ? address.houseNo
      : typeof address.houseNumber === "string"
        ? address.houseNumber
        : undefined;
  const streetName =
    typeof address.roadName === "string" && address.roadName
      ? address.roadName
      : typeof address.formattedAddress === "string"
        ? address.formattedAddress
        : "";

  const mappedAddress: CurrentLocationAddress = {
    latitude,
    longitude,
    houseNo,
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

function getApiResponsePayload(responseData: unknown) {
  return responseData &&
    typeof responseData === "object" &&
    "data" in responseData
    ? (responseData as { data?: unknown }).data
    : responseData;
}

function getApiRequestErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    const data = getApiResponsePayload(responseData);

    return getErrorMessage(data ?? responseData ?? error, fallback);
  }

  return getErrorMessage(error, fallback);
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSavedAddress(value: unknown): value is SavedAddress {
  return Boolean(value && typeof value === "object");
}

function mapSavedAddress(value: unknown): SavedAddress | null {
  const data = getApiResponsePayload(value);
  const address = Array.isArray(data) ? data[0] : data;

  if (!isSavedAddress(address)) return null;

  const mappedAddress: SavedAddress = {
    houseNo:
      getStringValue(address.houseNo) || getStringValue(address.houseNumber),
    streetName:
      getStringValue(address.streetName) || getStringValue(address.roadName),
    pincode: getStringValue(address.pincode),
    district: getStringValue(address.district),
    phoneNumber: getStringValue(address.phoneNumber),
    state: getStringValue(address.state),
    location: getStringValue(address.location),
  };

  return Object.values(mappedAddress).some(Boolean) ? mappedAddress : null;
}

async function getSavedAddress() {
  try {
    const response = await apiClient.get("/addresses/me");

    return mapSavedAddress(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    console.error("[address] unable to load saved address", error);
    return null;
  }
}

async function replaceSavedAddress(address: AddressSnapshot) {
  try {
    await apiClient.put("/addresses/me", address);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await apiClient.post("/addresses", address);
      return;
    }

    console.error("[address] unable to replace saved address", error);
  }
}

function createAddressSnapshot(form: BookingForm): AddressSnapshot | null {
  if (!form.wantsPrasad) return null;

  const streetName = form.streetName.trim();
  const pincode = form.pincode.trim();
  const district = form.district.trim();
  const phoneNumber = form.phoneNumber.trim();

  if (!streetName || !pincode || !district || !phoneNumber) return null;

  return {
    houseNo: form.houseNo.trim() || undefined,
    streetName,
    pincode,
    district,
    phoneNumber,
    state: form.state.trim() || undefined,
    location: streetName.startsWith("Current location:")
      ? streetName.replace("Current location:", "").trim()
      : undefined,
  };
}

function mergeSavedAddressIntoEmptyFields(
  current: BookingForm,
  savedAddress: SavedAddress,
): BookingForm {
  return {
    ...current,
    state: current.state || savedAddress.state || "",
    houseNo: current.houseNo || savedAddress.houseNo || "",
    streetName: current.streetName || savedAddress.streetName || "",
    pincode: current.pincode || savedAddress.pincode || "",
    district: current.district || savedAddress.district || "",
    phoneNumber: current.phoneNumber || savedAddress.phoneNumber || "",
  };
}

function isPaymentSession(value: unknown): value is PaymentSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<PaymentSession>;

  return (
    typeof session.bookingId === "string" &&
    typeof session.transactionId === "string" &&
    typeof session.amount === "number" &&
    typeof session.currency === "string" &&
    typeof session.gatewayReference === "string" &&
    (session.gatewayMode === "order" ||
      session.gatewayMode === "subscription" ||
      session.gatewayMode === "autopay-qr")
  );
}

async function createBackendPaymentSession(payload: unknown) {
  try {
    const response = await apiClient.post(
      "/bookings/checkout-session",
      payload,
    );
    const data = getApiResponsePayload(response.data);

    if (!isPaymentSession(data)) {
      throw new Error("Payment service returned an invalid checkout session.");
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("[checkout] create session failed", {
        status: error.response?.status,
        responseData: error.response?.data,
      });
    }

    throw new Error(
      getApiRequestErrorMessage(
        error,
        "Unable to create Razorpay checkout session.",
      ),
    );
  }
}
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

function inputClassName(isInvalid = false) {
  return [
    "mt-1.5 h-11 w-full rounded-lg bg-white px-4 text-[14px] shadow-sm outline-none transition-all placeholder:text-[#9aa3b8]",
    isInvalid
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-saffron focus:ring-2 focus:ring-saffron/20",
  ].join(" ");
}

function selectClassName(value: string, isInvalid = false) {
  return [
    "mt-1.5 h-11 w-full rounded-lg border bg-white px-4 text-[14px] font-semibold shadow-sm outline-none transition-all",
    isInvalid
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-saffron focus:ring-2 focus:ring-saffron/20",
    value ? "text-[#061b4d]" : "text-[#9aa3b8]",
  ].join(" ");
}

function getStateIsoCode(stateName: string) {
  return INDIAN_STATES.find((state) => state.name === stateName)?.isoCode ?? "";
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

type PrasadToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

function PrasadToggle({
  checked,
  onChange,
  yesLabel,
  noLabel,
}: PrasadToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Prasadam preference"
      className={[
        "relative grid h-9 w-full shrink-0 grid-cols-2 overflow-hidden rounded-full border border-[#d8dfeb] bg-[#f8fafc] p-1 transition-[box-shadow] duration-500 sm:h-11 sm:w-[146px]",
        checked
          ? "shadow-[0_0_0_2px_rgba(245,178,49,0.28),0_7px_18px_rgba(245,178,49,0.22)]"
          : "shadow-[0_4px_14px_rgba(15,23,42,0.09)]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full shadow-[0_4px_10px_rgba(15,23,42,0.16)] transition-all duration-300 ease-out",
          checked
            ? "left-1 bg-[#16a34a]"
            : "left-[calc(50%+0px)] bg-[#e11d27]",
        ].join(" ")}
      />
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={() => onChange(true)}
        className={[
          "relative z-10 flex items-center justify-center gap-1 rounded-full text-[10px] font-extrabold uppercase transition-[color,text-shadow,transform] duration-500 sm:gap-1.5 sm:text-[11px]",
          checked
            ? "scale-[1.02] text-[#fff0b8] [text-shadow:0_1px_7px_rgba(255,213,92,0.85)]"
            : "text-[#647086] hover:text-[#d49a1d]",
        ].join(" ")}
      >
        <Check className="h-3 w-3 stroke-[3] transition-colors duration-500 sm:h-3.5 sm:w-3.5" />
        <span className="transition-colors duration-500">{yesLabel}</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!checked}
        onClick={() => onChange(false)}
        className={[
          "relative z-10 flex items-center justify-center gap-1 rounded-full text-[10px] font-extrabold uppercase transition-colors duration-300 sm:gap-1.5 sm:text-[11px]",
          !checked ? "text-white" : "text-[#647086] hover:text-[#e11d27]",
        ].join(" ")}
      >
        {noLabel}
        <X className="h-3 w-3 stroke-[3] sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}
export function PoojaBookingView({ poojaId, plan }: PoojaBookingViewProps) {
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [form, setForm] = useState<BookingForm>(DEFAULT_BOOKING_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [isChangingWhatsappNumber, setIsChangingWhatsappNumber] =
    useState(false);
  const [hasTriedContinue, setHasTriedContinue] = useState(false);
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
  const [hasLoadedSavedAddress, setHasLoadedSavedAddress] = useState(false);
  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authWhatsappNumber = useAuthStore((state) => state.whatsappNumber);

  const bookingText = bookingCopy[language] ?? bookingCopy.en;
  const dbLanguage = DB_LANGUAGE_BY_APP_LANGUAGE[language] ?? "EN";

  useEffect(() => {
    let isActive = true;

    const timer = window.setTimeout(() => {
      const isLoggedIn = isClientLoggedIn();
      const storedWhatsappNumber = getClientWhatsappNumber();

      setIsWhatsappVerified(isLoggedIn);

      if (isLoggedIn && storedWhatsappNumber) {
        setForm((current) => ({
          ...current,
          whatsappNumber: current.whatsappNumber || storedWhatsappNumber,
        }));
      }

      if (isLoggedIn) {
        void prefillSavedAddressIfEmpty();
      }
    }, 0);

    async function prefillSavedAddressIfEmpty() {
      if (hasLoadedSavedAddress) return;

      const savedAddress = await getSavedAddress();
      if (!isActive) return;

      setHasLoadedSavedAddress(true);

      if (!savedAddress) return;

      setForm((current) =>
        mergeSavedAddressIntoEmptyFields(current, savedAddress),
      );
    }

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [hasLoadedSavedAddress]);

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
        setError(getErrorMessage(loadError, bookingText.couldNotLoadBooking));
        setPooja(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [bookingText.couldNotLoadBooking, poojaId]);

  const selectedPlan =
    plan === "weekly" && pooja?.isWeekly ? "weekly" : "single";

  const summary = useMemo(() => {
    if (!pooja) return null;

    const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
      pooja.translations,
      dbLanguage,
    );
    const templeTranslation = getLocalizedTranslation<TempleTranslation>(
      pooja.temple?.translations,
      dbLanguage,
    );
    const discount =
      selectedPlan === "weekly" ? pooja.weeklyDiscount : pooja.normalDiscount;
    const amount = getDiscountedAmount(pooja.baseAmount, discount);
    const baseAmount = Number(pooja.baseAmount);
    const hasDiscountedAmount =
      Number.isFinite(baseAmount) && Number(amount) < baseAmount;
    const image = getApiImageUrl(pooja.imageUrls?.[0] ?? "/nava_graha.png");

    return {
      title: poojaTranslation?.name ?? "Pooja",
      templeName: templeTranslation?.name ?? "Temple",
      templePlace: templeTranslation?.place ?? "",
      poojaDay: pooja.poojaDay,
      poojaTime: pooja.poojaTime,
      poojaDayLabel: getPoojaDateLabel(pooja.poojaDay),
      nextDate: getPoojaDateLabel(pooja.poojaDay),
      planName:
        selectedPlan === "weekly"
          ? bookingText.weeklyPlan
          : bookingText.singleDayPlan,
      amount,
      originalAmount: pooja.baseAmount,
      hasDiscountedAmount,
      image,
    };
  }, [
    bookingText.singleDayPlan,
    bookingText.weeklyPlan,
    dbLanguage,
    pooja,
    selectedPlan,
  ]);
  const activeStepIndex =
    checkoutStep === "details" ? 0 : checkoutStep === "payment" ? 1 : 2;
  const bookingSteps = bookingText.steps.slice(0, 3);
  const stateIsoCode = getStateIsoCode(form.state);
  const isSouthState =
    SOUTH_INDIAN_STATE_CODES.has(stateIsoCode) ||
    SOUTH_INDIAN_STATES.has(form.state.trim());
  const astrologicalFieldType = isSouthState ? "naal" : "gotra";
  const astrologicalFieldLabel = isSouthState
    ? bookingText.naal
    : bookingText.gothra;
  const astrologicalFieldPlaceholder = isSouthState
    ? bookingText.selectNaal
    : bookingText.enterGothra;
  const districts = useMemo(() => {
    if (!stateIsoCode) return form.district ? [form.district] : [];

    const stateDistricts = Array.from(
      new Set(
        City.getCitiesOfState("IN", stateIsoCode).map((city) => city.name),
      ),
    );

    if (form.district && !stateDistricts.includes(form.district)) {
      stateDistricts.push(form.district);
    }

    return stateDistricts.sort((first, second) => first.localeCompare(second));
  }, [form.district, stateIsoCode]);

  const addressSnapshot = useMemo(() => createAddressSnapshot(form), [form]);

  const bookingPayload = useMemo(
    () => ({
      poojaId,
      plan: selectedPlan,
      sankalpa: form.sankalpa.trim(),
      devotee: {
        name: form.name.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        state: form.state.trim(),
        naal: form.naal.trim(),
      },
      address: addressSnapshot,
    }),
    [addressSnapshot, form, poojaId, selectedPlan],
  );

  async function getRoleAfterLogin(fallbackRole: UserRole | null) {
    if (fallbackRole) return fallbackRole;

    try {
      return await refreshAuthSession();
    } catch {
      return null;
    }
  }

  async function refreshBeforeWhatsappVerification() {
    if (isChangingWhatsappNumber) return false;
    if (isAuthenticated && !isClientRefreshStale()) return true;
    if (
      authStatus !== "unknown" &&
      authStatus !== "checking" &&
      !isClientRefreshStale()
    ) {
      return false;
    }

    try {
      await refreshAuthSession();
      return true;
    } catch {
      return false;
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
    if (!/^[6-9]\d{9}$/.test(form.whatsappNumber)) {
      setOtpError(bookingText.validWhatsappError);
      return;
    }

    if (!isChangingWhatsappNumber) {
      const hasActiveSession =
        isClientLoggedIn() || (await refreshBeforeWhatsappVerification());

      if (hasActiveSession) {
        const storedWhatsappNumber =
          authWhatsappNumber || getClientWhatsappNumber();

        setIsWhatsappVerified(true);
        if (storedWhatsappNumber) {
          setForm((current) => ({
            ...current,
            whatsappNumber: current.whatsappNumber || storedWhatsappNumber,
          }));
        }
        return;
      }
    }
    setIsSendingOtp(true);
    setOtpError("");

    try {
      await sendOtpApi(form.whatsappNumber);
      setOtpSent(true);
      setOtp("");
      showToast("success", bookingText.otpSent);
    } catch (sendError: unknown) {
      setOtpError(getErrorMessage(sendError, bookingText.sendOtpError));
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function verifyBookingOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError(bookingText.otpCodeError);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const authResult = await verifyOtpApi(otp);
      const role = await getRoleAfterLogin(authResult.role);

      if (!role) throw new Error(bookingText.loginError);

      markClientWhatsappNumber(form.whatsappNumber);
      markClientLoggedIn(
        role,
        authResult.userId
          ? { id: authResult.userId, whatsappNumber: form.whatsappNumber }
          : { whatsappNumber: form.whatsappNumber },
      );
      setIsWhatsappVerified(true);
      setIsChangingWhatsappNumber(false);
      setOtpSent(false);
      const savedAddress = await getSavedAddress();
      setHasLoadedSavedAddress(true);
      if (savedAddress) {
        setForm((current) =>
          mergeSavedAddressIntoEmptyFields(current, savedAddress),
        );
      }
      setOtp("");
      showToast("success", bookingText.whatsappSuccess);
    } catch (verifyError: unknown) {
      const message = getErrorMessage(verifyError, bookingText.sendOtpError);

      if (message === SESSION_EXPIRED_ERROR) {
        setOtpSent(false);
        setOtp("");
        setOtpError(bookingText.otpRetry);
        return;
      }

      setOtpError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  }
  function handleChangeWhatsappNumber() {
    setIsChangingWhatsappNumber(true);
    setIsWhatsappVerified(false);
    setOtp("");
    setOtpSent(false);
    setOtpError("");
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
        state: location.state ?? current.state,
        houseNo: location.houseNo ?? current.houseNo,
        streetName: location.streetName,
        pincode: location.pincode ?? current.pincode,
        district: location.district ?? current.district,
      }));
      showToast("success", bookingText.currentLocationAdded);
    } catch (locationRequestError: unknown) {
      console.error(
        "[location] use current location failed",
        locationRequestError,
      );
      setLocationError(
        getErrorMessage(locationRequestError, bookingText.locationError),
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }
  function isRequiredFieldInvalid(value: string) {
    return hasTriedContinue && !value.trim();
  }

  function getBookingValidationError() {
    if (!form.name.trim()) return bookingText.validationName;
    if (!form.whatsappNumber.trim()) return bookingText.validationWhatsapp;
    if (!isWhatsappVerified) return bookingText.validationWhatsappVerify;
    if (!form.state.trim()) return bookingText.validationState;
    if (!form.naal.trim()) {
      return astrologicalFieldPlaceholder;
    }

    if (form.wantsPrasad) {
      if (!form.streetName.trim()) return bookingText.validationRoad;
      if (!form.pincode.trim()) return bookingText.validationPincode;
      if (!form.district.trim()) return bookingText.validationDistrict;
      if (!form.phoneNumber.trim()) return bookingText.validationPhone;
    }

    return "";
  }

  async function handleContinueToPayment() {
    if (isCreatingPayment) return;

    setHasTriedContinue(true);

    const validationError = getBookingValidationError();

    if (validationError) {
      showToast("error", validationError);
      return;
    }

    setIsCreatingPayment(true);

    try {
      if (addressSnapshot) {
        void replaceSavedAddress(addressSnapshot);
      }

      const nextSession = await createBackendPaymentSession(bookingPayload);
      setPaymentSession(nextSession);
      setSelectedPaymentMode(selectedPlan === "weekly" ? "autopay" : null);
      setCheckoutStep("payment");
      showToast("success", bookingText.checkoutCreated);
    } catch (createError: unknown) {
      showToast(
        "error",
        getErrorMessage(createError, bookingText.bookingCreateError),
      );
    } finally {
      setIsCreatingPayment(false);
    }
  }

  function handleBackendPaymentDone() {
    if (!paymentSession || isProcessingPayment) return;

    setIsProcessingPayment(true);
    setCheckoutStep("success");
    showToast("success", bookingText.paymentSuccessful);
    setIsProcessingPayment(false);
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
        <span className="text-sm font-bold">
          {bookingText.loadingBookingDetails}
        </span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-[#061b4d]">
          {bookingText.couldNotLoadBooking}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || bookingText.poojaNotFound}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.poojaDetails(poojaId)}>
            {bookingText.backToPooja}
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#061b4d]">
      <style jsx global>{`
        body > header,
        body > footer,
        .site-layout-footer {
          display: none !important;
        }
      `}</style>

      <header className="border-b border-[#dde2ec] bg-white">
        <div className="mx-auto flex h-16 max-w-295 items-center justify-between px-6">
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

      <section className="mx-auto max-w-290 px-5 pt-10">
        <div className="mx-auto grid w-full max-w-230 grid-cols-3 items-start gap-5">
          {bookingSteps.map((step, index) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center"
            >
              {index < bookingSteps.length - 1 && (
                <span
                  className={`absolute left-1/2 top-3.5 h-px w-full ${
                    index < activeStepIndex ? "bg-[#ef7d1a]" : "bg-[#e8ebf2]"
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold ${
                  index <= activeStepIndex
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

      <section className="mx-auto grid max-w-290 gap-12 px-5 pb-12 pt-16 lg:grid-cols-[620px_320px] lg:justify-between">
        {checkoutStep === "details" ? (
          <div className="rounded-2xl border border-[#e5e9f2] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-8">
            <form
              className="space-y-6"
              data-payload={JSON.stringify(bookingPayload)}
            >
              <div>
                <h1 className="text-[20px] font-extrabold leading-6 text-[#061b4d]">
                  {bookingText.detailsTitle}
                </h1>
                <p className="mt-1.5 text-[13px] font-semibold text-[#7d86a0]">
                  {bookingText.detailsSubtitle}
                </p>
              </div>

              <div className="mb-4 mt-6 border-b border-[#f0f2f7]" />

              <div className="space-y-4">
                <h2 className="text-[14px] font-extrabold text-[#061b4d]">
                  Personal Details
                </h2>
                <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>{bookingText.name}</FieldLabel>
                    <Input
                      className={inputClassName(
                        isRequiredFieldInvalid(form.name),
                      )}
                      name="name"
                      required
                      placeholder={bookingText.namePlaceholder}
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                    />
                  </label>

                  {(!isWhatsappVerified || !form.whatsappNumber.trim()) && (
                    <label className="block">
                      <FieldLabel required>
                        {bookingText.whatsappNumber}
                      </FieldLabel>
                      <Input
                        className={inputClassName(
                          isRequiredFieldInvalid(form.whatsappNumber),
                        )}
                        inputMode="tel"
                        name="whatsappNumber"
                        required
                        placeholder={bookingText.whatsappPlaceholder}
                        value={form.whatsappNumber}
                        onChange={(event) =>
                          handleWhatsAppNumberChange(event.target.value)
                        }
                      />
                    </label>
                  )}
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
                            ? bookingText.whatsappVerified
                            : bookingText.verifyWhatsappNumber}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-[#51a46c]">
                          {isWhatsappVerified
                            ? bookingText.whatsappReady
                            : bookingText.whatsappOtpInfo}
                        </p>
                      </div>
                    </div>
                    {isWhatsappVerified ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleChangeWhatsappNumber}
                        className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8]"
                      >
                        {bookingText.changeWhatsappNumber}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSendingOtp}
                        onClick={requestBookingOtp}
                        className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSendingOtp
                          ? bookingText.sending
                          : otpSent
                            ? bookingText.resendOtp
                            : bookingText.sendOtp}
                      </Button>
                    )}
                  </div>

                  {!isWhatsappVerified && otpSent && (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Input
                        className={[
                          "h-10 rounded-md px-4 text-center text-[16px] font-extrabold tracking-[0.35em] shadow-none outline-none transition placeholder:text-[#667399]",
                          isRequiredFieldInvalid(otp)
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                            : "border-[#d9e0ed] focus:border-saffron focus:ring-2 focus:ring-saffron/10",
                        ].join(" ")}
                        inputMode="numeric"
                        name="otp"
                        required
                        placeholder="------"
                        value={otp}
                        onChange={(event) =>
                          handleOtpChange(event.target.value)
                        }
                      />
                      <Button
                        type="button"
                        disabled={isVerifyingOtp}
                        onClick={verifyBookingOtp}
                        className="h-10 rounded-md bg-[#ef7d1a] px-5 text-[12px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isVerifyingOtp
                          ? bookingText.verifying
                          : bookingText.verifyAndLogin}
                      </Button>
                    </div>
                  )}

                  {otpError && (
                    <p className="text-[10px] font-bold text-red-600">
                      {otpError}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4 mt-6 border-b border-[#f0f2f7]" />

              <div className="space-y-4">
                <h2 className="text-[14px] font-extrabold text-[#061b4d]">
                  Astrological Details
                </h2>
                <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel required>{bookingText.state}</FieldLabel>
                    <select
                      className={selectClassName(
                        form.state,
                        isRequiredFieldInvalid(form.state),
                      )}
                      name="state"
                      required
                      value={form.state}
                      onChange={(event) =>
                        handleStateChange(event.target.value)
                      }
                    >
                      <option value="">{bookingText.selectState}</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state.isoCode} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <FieldLabel required>{astrologicalFieldLabel}</FieldLabel>
                    {isSouthState ? (
                      <select
                        className={selectClassName(
                          form.naal,
                          isRequiredFieldInvalid(form.naal),
                        )}
                        key={astrologicalFieldType}
                        name="naal"
                        required
                        value={form.naal}
                        onChange={(event) =>
                          updateField("naal", event.target.value)
                        }
                      >
                        <option value="">{astrologicalFieldPlaceholder}</option>
                        {NAALS_SOUTH.map((naal) => (
                          <option key={naal} value={naal}>
                            {naal}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className={inputClassName(
                          isRequiredFieldInvalid(form.naal),
                        )}
                        key={astrologicalFieldType}
                        name="gotra"
                        required
                        placeholder={astrologicalFieldPlaceholder}
                        value={form.naal}
                        onChange={(event) =>
                          updateField("naal", event.target.value)
                        }
                      />
                    )}
                  </label>

                  <label className="block">
                    <FieldLabel>
                      {bookingText.sankalpa}{" "}
                      <span className="text-[#7d86a0]">
                        {bookingText.optional}
                      </span>
                    </FieldLabel>
                    <Input
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#e2e8f0] px-4 text-[14px] shadow-sm placeholder:text-[#9aa3b8] transition-all hover:border-[#cbd5e1] focus:border-saffron focus:ring-2 focus:ring-saffron/20"
                      name="sankalpa"
                      placeholder={bookingText.sankalpaPlaceholder}
                      value={form.sankalpa}
                      onChange={(event) =>
                        updateField("sankalpa", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <div
                  className={[
                    "flex min-h-22 flex-col items-stretch gap-2.5 rounded-[14px] border px-3 py-3 transition-all duration-300 sm:min-h-[88px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4",
                    form.wantsPrasad
                      ? "border-[#ffad32] bg-[#fff8ed] shadow-[0_4px_14px_rgba(239,125,26,0.10)]"
                      : "border-[#fcdba9] bg-white",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateField("wantsPrasad", !form.wantsPrasad)
                    }
                    className="group flex min-w-0 items-center gap-2 text-left sm:flex-1 sm:gap-3"
                  >
                    <span
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[#ffbd55] transition-[transform,box-shadow,background-color] duration-500 ease-out sm:h-14.5 sm:w-14.5",
                        form.wantsPrasad
                          ? "scale-105 border-[#ffbd55] bg-[#fcd9a1] shadow-[0_8px_18px_rgba(239,125,26,0.22)] sm:scale-125"
                          : "scale-100 border-0 bg-transparent",
                      ].join(" ")}
                    >
                      <Image
                        src="/prasad.png"
                        alt="Prasad"
                        width={88}
                        height={88}
                        className="h-12 w-12 object-contain transition-transform duration-300 ease-out group-active:scale-110 sm:h-[66px] sm:w-[66px]"
                      />
                    </span>
                    <span className="min-w-0 pr-1">
                      <span className="block text-[11px] font-extrabold leading-4 text-[#111827] sm:text-[13px] sm:leading-4">
                        {bookingText.prasadQuestion}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] font-medium leading-3 text-[#4f5972] sm:text-[10px]">
                        This prasadams will reach your doorstep.
                      </span>
                    </span>
                  </button>
                  <div className="w-full sm:w-auto sm:shrink-0">
                    <PrasadToggle
                      checked={form.wantsPrasad}
                      yesLabel={bookingText.yes}
                      noLabel={bookingText.no}
                      onChange={(checked) =>
                        updateField("wantsPrasad", checked)
                      }
                    />
                  </div>
                </div>
              </div>
              <div
                className={`grid transition-all duration-500 ease-in-out ${
                  form.wantsPrasad
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-x-7 gap-y-5 pt-4 md:grid-cols-2">
                    <label className="block">
                      <FieldLabel>{bookingText.houseNo}</FieldLabel>
                      <Input
                        className="mt-1.5 h-11 w-full rounded-lg border border-[#e2e8f0] px-4 text-[14px] shadow-sm placeholder:text-[#9aa3b8] transition-all hover:border-[#cbd5e1] focus:border-saffron focus:ring-2 focus:ring-saffron/20"
                        name="houseNo"
                        placeholder={bookingText.houseNoPlaceholder}
                        value={form.houseNo}
                        onChange={(event) =>
                          updateField("houseNo", event.target.value)
                        }
                      />
                    </label>

                    <div className="flex items-end justify-center md:justify-start">
                      <div className="mb-1 space-y-1 ">
                        <button
                          type="button"
                          disabled={isDetectingLocation}
                          onClick={handleUseCurrentLocation}
                          className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#ef7d1a] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Navigation className="h-6 w-6" />
                          {isDetectingLocation
                            ? bookingText.gettingLocation
                            : bookingText.useCurrentLocation}
                        </button>
                        {locationError && (
                          <p className="max-w-52 text-[10px] font-bold leading-4 text-red-600">
                            {locationError}
                          </p>
                        )}
                      </div>
                    </div>

                    <label className="block">
                      <FieldLabel required>{bookingText.roadName}</FieldLabel>
                      <Input
                        className={inputClassName(
                          isRequiredFieldInvalid(form.streetName),
                        )}
                        name="streetName"
                        required
                        placeholder={bookingText.roadNamePlaceholder}
                        value={form.streetName}
                        onChange={(event) =>
                          updateField("streetName", event.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>{bookingText.pincode}</FieldLabel>
                      <Input
                        className={inputClassName(
                          isRequiredFieldInvalid(form.pincode),
                        )}
                        inputMode="numeric"
                        name="pincode"
                        required
                        placeholder={bookingText.pincodePlaceholder}
                        value={form.pincode}
                        onChange={(event) =>
                          updateField("pincode", event.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>{bookingText.district}</FieldLabel>
                      <select
                        className={selectClassName(
                          form.district,
                          isRequiredFieldInvalid(form.district),
                        )}
                        name="district"
                        required
                        value={form.district}
                        onChange={(event) =>
                          updateField("district", event.target.value)
                        }
                      >
                        <option value="">{bookingText.selectDistrict}</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <FieldLabel required>
                        {bookingText.phoneNumber}
                      </FieldLabel>
                      <Input
                        className={inputClassName(
                          isRequiredFieldInvalid(form.phoneNumber),
                        )}
                        inputMode="tel"
                        name="phoneNumber"
                        required
                        placeholder={bookingText.phoneNumberPlaceholder}
                        value={form.phoneNumber}
                        onChange={(event) =>
                          updateField("phoneNumber", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : checkoutStep === "payment" ? (
          <BookingPaymentPage
            paymentSession={paymentSession}
            selectedPlan={selectedPlan}
            selectedPaymentMode={selectedPaymentMode}
            isProcessingPayment={isProcessingPayment}
            text={bookingText}
            onPaymentModeChange={setSelectedPaymentMode}
            onBack={handleBackToDetails}
            onComplete={handleBackendPaymentDone}
          />
        ) : null}

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <aside className="rounded-2xl border border-[#e5e9f2] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h2 className="text-[14px] font-extrabold text-[#061b4d]">
              {bookingText.bookingSummary}
            </h2>
            <div className="mt-4 grid grid-cols-[72px_1fr] gap-4">
              <div className="relative h-18 overflow-hidden rounded-sm bg-[#f4f4f4]">
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
                  {bookingText.poojaDay}
                </span>
                <span className="text-right text-[#061b4d]">
                  {summary.poojaDayLabel}
                </span>
              </p>
              {summary.poojaTime && (
                <p className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#8f98ad]" />
                    {bookingText.poojaTime}
                  </span>
                  <span className="text-right text-[#061b4d]">
                    {summary.poojaTime}
                  </span>
                </p>
              )}
              <p className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4 text-[#8f98ad]" />
                  {bookingText.planType}
                </span>
                <span className="text-[#ef7d1a]">{summary.planName}</span>
              </p>
            </div>

            <div className="my-5 border-t border-[#edf0f6]" />
            <p className="flex items-center justify-between text-[12px] font-extrabold text-[#061b4d]">
              {bookingText.amount}
              <span className="flex flex-col items-end text-right">
                {summary.hasDiscountedAmount && (
                  <span className="text-xs text-[#8a92a5] line-through">
                    {bookingText.currencyPrefix}
                    {formatAmount(summary.originalAmount)}
                  </span>
                )}
                <span className="text-lg text-[#ef7d1a]">
                  {bookingText.currencyPrefix}
                  {formatAmount(summary.amount)}
                </span>
              </span>
            </p>

            <div className="mt-4 rounded-md bg-[#fff4e8] p-4">
              <p className="text-[12px] font-extrabold text-[#ef7d1a]">
                {bookingText.whatIsIncluded}
              </p>
              <div className="mt-3 space-y-2 text-[10px] font-bold text-[#4f5972]">
                {form.wantsPrasad && (
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                    {bookingText.prasadam}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                  {bookingText.photosVideoWhatsapp}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-md bg-[#effff4] p-4 text-[10px] font-bold text-[#149149]">
              <p className="flex items-center gap-2 text-[12px] font-extrabold">
                <ShieldCheck className="h-6 w-4" />
                {bookingText.secureBooking}
              </p>
              <p className="mt-1 text-[#55a36d]">
                {bookingText.secureBookingText}
              </p>
            </div>
          </aside>

          <div>
            <p className="mb-7 flex items-center gap-2 text-[10px] font-semibold text-[#8a92a5]">
              <Lock className="h-3.5 w-3.5" />
              {bookingText.informationSecure}
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
                ? bookingText.verifyWhatsappToContinue
                : isCreatingPayment
                  ? bookingText.creatingBooking
                  : checkoutStep === "details"
                    ? bookingText.continueToPayment
                    : bookingText.paymentInProgress}
              <ArrowRight className="motion-arrow-right h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-190 grid-cols-2 gap-6 px-5 pb-12 pt-2 md:grid-cols-4">
        {bookingText.trustItems.map((item, index) => {
          const Icon = BOOKING_TRUST_ITEM_ICONS[index] ?? Lock;
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

      <BookingSuccessModal
        open={checkoutStep === "success"}
        summary={summary}
        paymentSession={paymentSession}
        whatsappNumber={form.whatsappNumber}
        text={bookingText}
        onClose={() => setCheckoutStep("details")}
        formatAmount={formatAmount}
      />

      <FooterLegalSection
        className="border-[#dfe4ee] bg-white"
        containerClassName="max-w-290 px-5 py-5 text-[10px] font-semibold text-[#7d86a0]"
        termsLabel={bookingText.termsOfUse}
        refundLabel={bookingText.refundPolicy}
      />
    </main>
  );
}
