"use client";

import axios from "axios";
import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useEffect, useMemo, useRef, useState } from "react";
import { City } from "country-state-city";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Check,
  Clock,
  Home,
  Lock,
  Loader2,
  Navigation,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

import { LanguageSelector } from "@/components/ui/language-selector";
import { FooterLegalSection } from "@/components/layout/Footer";
import { PaymentMethodPage } from "@/components/payment/payment-method-page";
import { BookingSuccessModal } from "@/components/blocks/pooja-booking/BookingSuccessModal";
import { OfferingSelectionStep } from "@/components/blocks/pooja-booking/OfferingSelectionStep";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsappPhoneInput } from "@/components/ui/whatsapp-phone-input";
import {
  formatWhatsappNumber,
  isValidWhatsappNumber,
  normalizeWhatsappNumber,
} from "@/lib/phone";
import {
  DB_LANGUAGE_BY_APP_LANGUAGE,
  DEFAULT_BOOKING_FORM,
  INDIAN_STATES,
  NAALS_SOUTH,
  SESSION_EXPIRED_ERROR,
  SOUTH_INDIAN_STATES,
  SOUTH_INDIAN_STATE_CODES,
} from "@/constants/pooja-booking.const";
import { APP_ROUTES } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import {
  getActiveOfferingsApi,
  type Offering,
} from "@/lib/api/offering/offerings.api";
import apiClient, { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { sendOtpApi } from "@/lib/api/user/send-otp.api";
import { verifyOtpApi } from "@/lib/api/user/verify-otp.api";
import {
  sendChangeWhatsappOtpApi,
  verifyChangeWhatsappOtpApi,
} from "@/lib/api/user/change-whatsapp.api";
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
import { cn, getErrorMessage } from "@/lib/utils";

type PoojaBookingViewProps = {
  poojaId: string;
  plan?: string;
};

type DbLanguage = PoojaTranslation["language"];

type CheckoutStep = "auth" | "offerings" | "details" | "payment" | "success";

const CHECKOUT_STEPS: CheckoutStep[] = [
  "auth",
  "details",
  "offerings",
  "payment",
  "success",
];

function isCheckoutStep(value: string | null): value is CheckoutStep {
  return CHECKOUT_STEPS.includes(value as CheckoutStep);
}

type PaymentSession = {
  bookingReference: string;
  transactionReference: string;
  keyId?: string;
  amount: number;
  currency: string;
  gatewayMode: "order" | "subscription" | "autopay-qr";
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  qrImageContent?: string;
  gatewayReference: string;
  priceBreakdown: {
    poojaBaseAmount: number;
    poojaUnitAmount: number;
    devoteeCount: number;
    poojaAmount: number;
    offerings: Array<{
      offeringSlug: string;
      nameSnapshot: string;
      quantity: number;
      unitAmount: number;
      total: number;
    }>;
    offeringTotal: number;
    dakshinaAmount: number;
    grandTotal: number;
    recurringWeeklyAmount: number;
    currency: "INR";
  };
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
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

type AdditionalDevotee = {
  id: string;
  name: string;
  naal: string;
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
  deliveryState: string;
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
type LastBookingDevoteeDetails = {
  devotees: Array<{ name: string; naal: string }>;
  whatsappNumber: string;
  state: string;
  address: SavedAddress | null;
};

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
  const requestUrl = new URL(
    "/api/backend/addresses/reverse-geocode",
    window.location.origin,
  );
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

function formatWhatsappDisplayNumber(value: string) {
  return formatWhatsappNumber(value);
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

function mapLastBookingDevoteeDetails(
  value: unknown,
): LastBookingDevoteeDetails | null {
  const data = getApiResponsePayload(value);
  if (!data || typeof data !== "object") return null;

  const details = data as {
    devotees?: unknown;
    whatsappNumber?: unknown;
    state?: unknown;
    address?: unknown;
  };
  const devotees = Array.isArray(details.devotees)
    ? details.devotees
        .filter((devotee): devotee is { name?: unknown; naal?: unknown } =>
          Boolean(devotee && typeof devotee === "object"),
        )
        .map((devotee) => ({
          name: getStringValue(devotee.name),
          naal: getStringValue(devotee.naal),
        }))
        .filter((devotee) => devotee.name && devotee.naal)
    : [];

  return {
    devotees,
    whatsappNumber: getStringValue(details.whatsappNumber),
    state: getStringValue(details.state),
    address: mapSavedAddress(details.address),
  };
}

async function getLastBookingDevoteeDetails() {
  try {
    const response = await apiClient.get("/bookings/last-devotee-details");

    return mapLastBookingDevoteeDetails(response.data);
  } catch (error: unknown) {
    console.error(
      "[booking-prefill] unable to load last booking details",
      error,
    );
    return null;
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
    state: form.deliveryState.trim() || undefined,
    location: streetName.startsWith("Current location:")
      ? streetName.replace("Current location:", "").trim()
      : undefined,
  };
}

function createCheckoutAddress(address: AddressSnapshot | null) {
  if (!address) return null;

  return {
    houseNo: address.houseNo,
    streetName: address.streetName,
    pincode: address.pincode,
    district: address.district,
    state: address.state,
    phoneNumber: address.phoneNumber,
    location: address.location,
  };
}

function mergeSavedAddressIntoEmptyFields(
  current: BookingForm,
  savedAddress: SavedAddress,
): BookingForm {
  return {
    ...current,
    state: current.state,
    deliveryState: current.deliveryState || savedAddress.state || "",
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
  const breakdown = session.priceBreakdown;

  return (
    typeof session.bookingReference === "string" &&
    typeof session.transactionReference === "string" &&
    typeof session.amount === "number" &&
    typeof session.currency === "string" &&
    typeof session.gatewayReference === "string" &&
    (session.gatewayMode === "order" ||
      session.gatewayMode === "subscription" ||
      session.gatewayMode === "autopay-qr") &&
    Boolean(breakdown && typeof breakdown === "object") &&
    typeof breakdown?.poojaAmount === "number" &&
    Array.isArray(breakdown.offerings) &&
    typeof breakdown.offeringTotal === "number" &&
    typeof breakdown.dakshinaAmount === "number" &&
    typeof breakdown.grandTotal === "number" &&
    breakdown.currency === "INR"
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

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
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
    <span className="text-[12px] font-semibold text-[#061b4d]">
      {children} {required && <span className="text-[#ef7d1a]">*</span>}
    </span>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type FloatingSelectProps = {
  className?: string;
  name: string;
  onBeforeOpen?: () => boolean;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
};

function FloatingSelect({
  className,
  name,
  onBeforeOpen,
  onChange,
  options,
  placeholder,
  value,
}: FloatingSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const searchRef = useRef("");
  const searchTimerRef = useRef<number | null>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];
  const listboxId = `${name}-options`;

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    },
    [],
  );

  function openSelect(index = selectedIndex >= 0 ? selectedIndex : 0) {
    if (!isOpen && onBeforeOpen?.() === false) return false;
    setIsOpen(true);
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
    return true;
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setIsOpen(false);
    setActiveIndex(index);
    triggerRef.current?.focus();
  }

  function moveActive(direction: 1 | -1) {
    if (!options.length) return;
    const start = activeIndex >= 0 ? activeIndex : selectedIndex;
    const next =
      (Math.max(start, 0) + direction + options.length) % options.length;
    setActiveIndex(next);
  }

  function searchByKeyboard(key: string) {
    searchRef.current += key.toLocaleLowerCase();
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      searchRef.current = "";
    }, 700);

    const search = searchRef.current;
    let matchIndex = options.findIndex((option) =>
      option.label.toLocaleLowerCase().startsWith(search),
    );

    if (matchIndex < 0 && search.length > 1) {
      searchRef.current = key.toLocaleLowerCase();
      matchIndex = options.findIndex((option) =>
        option.label.toLocaleLowerCase().startsWith(searchRef.current),
      );
    }

    if (matchIndex >= 0 && openSelect(matchIndex)) setActiveIndex(matchIndex);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (/^[\p{L}\p{N}]$/u.test(event.key)) {
      event.preventDefault();
      searchByKeyboard(event.key);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openSelect();
      } else {
        moveActive(event.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      selectOption(activeIndex);
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        name={name}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        data-floating-select
        data-has-value={value ? "true" : "false"}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openSelect();
          }
        }}
        className={cn(className, "flex items-center text-left")}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate transition-colors duration-300",
            !value && "text-[#9aa3b8]",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#7d86a0] transition-transform duration-300",
            isOpen && "rotate-180 text-[#ef7d1a]",
          )}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="booking-select-menu absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-56 overflow-auto rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-xl shadow-black/12"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                id={`${listboxId}-${index}`}
                key={option.value}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectOption(index);
                }}
                className={cn(
                  "flex min-h-9 w-full items-center rounded-md px-3 text-left text-[13px] font-medium text-[#061b4d] transition-colors hover:bg-[#fff4e8] hover:text-[#ef7d1a]",
                  (isSelected || isActive) && "bg-[#fff4e8] text-[#ef7d1a]",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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
          checked ? "left-1 bg-[#16a34a]" : "left-[calc(50%+0px)] bg-[#e11d27]",
        ].join(" ")}
      />
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={() => onChange(true)}
        className={[
          "relative z-10 flex items-center justify-center gap-1 rounded-full text-[10px] font-semibold uppercase transition-[color,text-shadow,transform] duration-500 sm:gap-1.5 sm:text-[11px]",
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
          "relative z-10 flex items-center justify-center gap-1 rounded-full text-[10px] font-semibold uppercase transition-colors duration-300 sm:gap-1.5 sm:text-[11px]",
          !checked ? "text-white" : "text-[#647086] hover:text-[#e11d27]",
        ].join(" ")}
      >
        {noLabel}
        <X className="h-3 w-3 stroke-[3] sm:h-3.5 sm:w-3.5" />
      </button>
    </div>
  );
}

function getAssignedOfferings(pooja: Pooja, activeOfferings: Offering[]) {
  const assignedIds = new Set(
    (pooja.offerings ?? []).map((offering) => offering.slug),
  );

  return activeOfferings.filter((offering) => assignedIds.has(offering.slug));
}
export function PoojaBookingView({ poojaId, plan }: PoojaBookingViewProps) {
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [form, setForm] = useState<BookingForm>(DEFAULT_BOOKING_FORM);
  const [additionalDevotees, setAdditionalDevotees] = useState<
    AdditionalDevotee[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
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
  const [changeWhatsappSessionId, setChangeWhatsappSessionId] = useState("");
  const whatsappInputRef = useRef<HTMLInputElement>(null);
  const [hasTriedContinue, setHasTriedContinue] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(() => {
    const requestedStep = searchParams.get("checkoutStep");
    return isCheckoutStep(requestedStep) ? requestedStep : "auth";
  });
  const previousCheckoutStepRef = useRef<CheckoutStep>("auth");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const [dakshinaAmount, setDakshinaAmount] = useState("0");
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState("");
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasLoadedSavedAddress, setHasLoadedSavedAddress] = useState(false);
  const [hasLoadedLastBookingDetails, setHasLoadedLastBookingDetails] =
    useState(false);
  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authWhatsappNumber = useAuthStore((state) => state.whatsappNumber);

  const bookingText = bookingCopy[language] ?? bookingCopy.en;
  const dbLanguage = DB_LANGUAGE_BY_APP_LANGUAGE[language] ?? "EN";
  function navigateToCheckoutStep(
    nextStep: CheckoutStep,
    options: { replace?: boolean } = {},
  ) {
    const url = new URL(window.location.href);
    url.searchParams.set("checkoutStep", nextStep);
    const historyState = {
      ...(window.history.state ?? {}),
      yaagamCheckoutStep: nextStep,
    };

    if (options.replace) {
      window.history.replaceState(historyState, "", url);
    } else {
      window.history.pushState(historyState, "", url);
    }

    setCheckoutStep(nextStep);
  }

  function navigateBackToCheckoutStep(fallbackStep: CheckoutStep) {
    const currentUrlStep = new URLSearchParams(window.location.search).get(
      "checkoutStep",
    );

    if (
      currentUrlStep === checkoutStep &&
      window.history.state?.yaagamCheckoutStep === checkoutStep &&
      checkoutStep !== "auth"
    ) {
      window.history.back();
      return;
    }

    navigateToCheckoutStep(fallbackStep, { replace: true });
  }

  useEffect(() => {
    const currentStep = new URLSearchParams(window.location.search).get(
      "checkoutStep",
    );

    if (!isCheckoutStep(currentStep)) {
      const url = new URL(window.location.href);
      url.searchParams.set("checkoutStep", "auth");
      window.history.replaceState(
        { ...(window.history.state ?? {}), yaagamCheckoutStep: "auth" },
        "",
        url,
      );
    }

    function handlePopState() {
      const nextStep = new URLSearchParams(window.location.search).get(
        "checkoutStep",
      );

      if (isCheckoutStep(nextStep)) {
        setCheckoutStep(nextStep);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    if (
      checkoutStep !== "details" ||
      !isAuthenticated ||
      hasLoadedLastBookingDetails
    ) {
      return;
    }

    let isActive = true;

    async function prefillFromLastBooking() {
      const details = await getLastBookingDevoteeDetails();
      if (!isActive) return;

      setHasLoadedLastBookingDetails(true);
      if (!details) return;

      const primaryDevotee = details.devotees[0];
      setForm((current) => {
        const withAddress = details.address
          ? mergeSavedAddressIntoEmptyFields(current, details.address)
          : current;

        return {
          ...withAddress,
          name: withAddress.name || primaryDevotee?.name || "",
          naal: withAddress.naal || primaryDevotee?.naal || "",
          state: withAddress.state || details.state,
          whatsappNumber: withAddress.whatsappNumber || details.whatsappNumber,
        };
      });
      setAdditionalDevotees((current) =>
        current.length > 0
          ? current
          : details.devotees.slice(1, 4).map((devotee) => ({
              id: crypto.randomUUID(),
              ...devotee,
            })),
      );
    }

    void prefillFromLastBooking();

    return () => {
      isActive = false;
    };
  }, [checkoutStep, hasLoadedLastBookingDetails, isAuthenticated]);
  useEffect(() => {
    let isActive = true;

    async function loadPooja() {
      setIsLoading(true);
      setError("");
      setIsLoadingOfferings(true);
      setOfferingsError("");

      try {
        const [poojaResult, offeringsResult] = await Promise.allSettled([
          getPoojaDetailsApi(poojaId),
          getActiveOfferingsApi(),
        ]);

        if (!isActive) return;
        if (poojaResult.status === "rejected") throw poojaResult.reason;

        const nextPooja = poojaResult.value;
        setPooja(nextPooja);

        if (offeringsResult.status === "fulfilled") {
          setOfferings(getAssignedOfferings(nextPooja, offeringsResult.value));
        } else {
          setOfferingsError(
            getErrorMessage(
              offeringsResult.reason,
              bookingText.loadingOfferings,
            ),
          );
        }
        setIsLoadingOfferings(false);
      } catch (loadError: unknown) {
        if (!isActive) return;
        setError(getErrorMessage(loadError, bookingText.couldNotLoadBooking));
        setPooja(null);
        setIsLoadingOfferings(false);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [bookingText.couldNotLoadBooking, bookingText.loadingOfferings, poojaId]);

  async function refreshOfferings(notifyUnavailable = false) {
    setIsLoadingOfferings(true);
    setOfferingsError("");

    try {
      const [nextPooja, activeOfferings] = await Promise.all([
        getPoojaDetailsApi(poojaId),
        getActiveOfferingsApi(),
      ]);
      const nextOfferings = getAssignedOfferings(nextPooja, activeOfferings);
      const availableIds = new Set(
        nextOfferings.map((offering) => offering.slug),
      );

      setPooja(nextPooja);
      setOfferings(nextOfferings);
      setSelectedOfferingIds((current) =>
        current.filter((offeringId) => availableIds.has(offeringId)),
      );
      if (notifyUnavailable) {
        showToast("error", bookingText.offeringsUnavailable);
      }
    } catch (refreshError: unknown) {
      setOfferingsError(
        getErrorMessage(refreshError, bookingText.loadingOfferings),
      );
    } finally {
      setIsLoadingOfferings(false);
    }
  }

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
    const image = pooja.imageUrls?.[0] ?? "/nava_graha.png";

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
    checkoutStep === "auth"
      ? 0
      : checkoutStep === "details"
        ? 1
        : checkoutStep === "offerings"
          ? 2
          : checkoutStep === "payment"
            ? 3
            : 4;
  useEffect(() => {
    if (previousCheckoutStepRef.current === checkoutStep) return;

    previousCheckoutStepRef.current = checkoutStep;
    if (checkoutStep === "success") return;

    const frame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [checkoutStep]);
  const bookingSteps = [
    bookingText.verificationStep,
    bookingText.steps[0],
    bookingText.chooseOfferings,
    bookingText.completePayment,
    bookingText.bookingConfirmed,
  ];
  const stateIsoCode = getStateIsoCode(form.state);
  const deliveryStateIsoCode = getStateIsoCode(form.deliveryState);

  const isSouthState =
    SOUTH_INDIAN_STATE_CODES.has(stateIsoCode) ||
    SOUTH_INDIAN_STATES.has(form.state.trim());
  const astrologicalFieldLabel = isSouthState
    ? bookingText.naal
    : bookingText.gothra;
  const astrologicalFieldPlaceholder = isSouthState
    ? bookingText.selectNaal
    : bookingText.enterGothra;
  const districts = useMemo(() => {
    if (!deliveryStateIsoCode) return form.district ? [form.district] : [];

    const stateDistricts = Array.from(
      new Set(
        City.getCitiesOfState("IN", deliveryStateIsoCode).map(
          (city) => city.name,
        ),
      ),
    );

    if (form.district && !stateDistricts.includes(form.district)) {
      stateDistricts.push(form.district);
    }

    return stateDistricts.sort((first, second) => first.localeCompare(second));
  }, [form.district, deliveryStateIsoCode]);

  const addressSnapshot = useMemo(() => createAddressSnapshot(form), [form]);
  const normalizedDakshinaAmount =
    dakshinaAmount.trim() === "" ? 0 : Number(dakshinaAmount);
  const devoteeCount = 1 + additionalDevotees.length;

  const displayedPriceBreakdown = useMemo(() => {
    const poojaUnitAmount = Number(pooja?.discountAmount ?? 0);
    const poojaAmount = Number.isFinite(poojaUnitAmount)
      ? poojaUnitAmount * devoteeCount
      : 0;
    const offeringTotal = offerings
      .filter((offering) => selectedOfferingIds.includes(offering.slug))
      .reduce((total, offering) => {
        const discountedAmount = Number(offering.discountPrice);
        const amount =
          discountedAmount > 0
            ? discountedAmount
            : Number(offering.actualPrice);
        return total + (Number.isFinite(amount) ? amount : 0);
      }, 0);
    const dakshina = Number.isFinite(normalizedDakshinaAmount)
      ? normalizedDakshinaAmount
      : 0;

    return {
      poojaUnitAmount,
      poojaAmount,
      offeringTotal,
      dakshina,
      total: poojaAmount + offeringTotal + dakshina,
    };
  }, [
    devoteeCount,
    normalizedDakshinaAmount,
    offerings,
    pooja,
    selectedOfferingIds,
  ]);
  const displayedBookingTotal = displayedPriceBreakdown.total;
  const selectedOfferingNames = useMemo(
    () =>
      offerings
        .filter((offering) => selectedOfferingIds.includes(offering.slug))
        .map(
          (offering) =>
            getLocalizedTranslation(offering.translations, dbLanguage)?.name,
        )
        .filter((name): name is string => Boolean(name)),
    [dbLanguage, offerings, selectedOfferingIds],
  );
  const registeredWhatsappNumber = normalizeWhatsappNumber(
    authWhatsappNumber || getClientWhatsappNumber(),
  );
  const enteredWhatsappNumber = normalizeWhatsappNumber(form.whatsappNumber);
  const matchesRegisteredWhatsappNumber =
    Boolean(registeredWhatsappNumber) &&
    enteredWhatsappNumber === registeredWhatsappNumber;
  const hasVerifiedWhatsapp =
    !isChangingWhatsappNumber &&
    isWhatsappVerified &&
    matchesRegisteredWhatsappNumber;
  const checkoutWhatsappNumber = hasVerifiedWhatsapp
    ? registeredWhatsappNumber || form.whatsappNumber
    : form.whatsappNumber;
  const isUnchangedWhatsappNumber =
    isChangingWhatsappNumber && matchesRegisteredWhatsappNumber;

  const bookingPayload = useMemo(
    () => ({
      poojaSlug: poojaId,
      selectedPlan,
      offeringSlugs: selectedOfferingIds,
      dakshinaAmount: normalizedDakshinaAmount,
      sankalpa: form.sankalpa.trim(),
      devotee: {
        devotees: [
          { name: form.name.trim(), naal: form.naal.trim() },
          ...additionalDevotees.map((devotee) => ({
            name: devotee.name.trim(),
            naal: devotee.naal.trim(),
          })),
        ],
        whatsappNumber: checkoutWhatsappNumber,
        state: form.state.trim(),
      },
      address: createCheckoutAddress(addressSnapshot),
    }),
    [
      additionalDevotees,
      addressSnapshot,
      checkoutWhatsappNumber,
      form,
      normalizedDakshinaAmount,
      poojaId,
      selectedOfferingIds,
      selectedPlan,
    ],
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
    const nextWhatsappNumber = value;

    setForm((current) => ({
      ...current,
      whatsappNumber: nextWhatsappNumber,
    }));
    setOtp("");
    setOtpSent(false);
    setOtpError("");
    setIsWhatsappVerified(
      isClientLoggedIn() &&
        Boolean(registeredWhatsappNumber) &&
        nextWhatsappNumber === registeredWhatsappNumber,
    );
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setOtpError("");
  }

  async function requestBookingOtp() {
    if (isUnchangedWhatsappNumber) {
      setOtpError("Enter a different WhatsApp number to continue.");
      return;
    }

    if (!isValidWhatsappNumber(form.whatsappNumber)) {
      setOtpError(bookingText.validWhatsappError);
      return;
    }

    let shouldChangeWhatsappNumber = isChangingWhatsappNumber;

    if (!isChangingWhatsappNumber) {
      let hasActiveSession =
        isClientLoggedIn() || (await refreshBeforeWhatsappVerification());

      if (hasActiveSession) {
        try {
          await refreshAuthSession();
        } catch {
          hasActiveSession = false;
        }
      }

      if (hasActiveSession) {
        const storedWhatsappNumber = normalizeWhatsappNumber(
          getClientWhatsappNumber() || authWhatsappNumber,
        );
        const enteredWhatsappNumber = normalizeWhatsappNumber(
          form.whatsappNumber,
        );

        if (
          storedWhatsappNumber &&
          enteredWhatsappNumber === storedWhatsappNumber
        ) {
          setIsWhatsappVerified(true);
          return;
        }

        shouldChangeWhatsappNumber = true;
        setIsChangingWhatsappNumber(true);
        setIsWhatsappVerified(false);
      }
    }
    setIsSendingOtp(true);
    setOtpError("");

    try {
      if (shouldChangeWhatsappNumber) {
        const sessionId = await sendChangeWhatsappOtpApi(
          normalizeWhatsappNumber(form.whatsappNumber),
        );
        setChangeWhatsappSessionId(sessionId);
      } else {
        await sendOtpApi(normalizeWhatsappNumber(form.whatsappNumber));
      }
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
      if (isChangingWhatsappNumber) {
        if (!changeWhatsappSessionId) {
          throw new Error("Request a new OTP before verification.");
        }
        const changedNumber = await verifyChangeWhatsappOtpApi(
          changeWhatsappSessionId,
          otp,
        );
        markClientWhatsappNumber(changedNumber);
        setForm((current) => ({
          ...current,
          whatsappNumber: changedNumber,
        }));
        setIsWhatsappVerified(true);
        setIsChangingWhatsappNumber(false);
        setChangeWhatsappSessionId("");
        setOtpSent(false);
        setOtp("");
        showToast("success", bookingText.whatsappSuccess);
        return;
      }

      const authResult = await verifyOtpApi(otp);
      const role = await getRoleAfterLogin(authResult.role);

      if (!role) throw new Error(bookingText.loginError);

      markClientWhatsappNumber(normalizeWhatsappNumber(form.whatsappNumber));
      markClientLoggedIn(
        role,
        authResult.userId
          ? {
              id: authResult.userId,
              whatsappNumber: normalizeWhatsappNumber(form.whatsappNumber),
            }
          : { whatsappNumber: normalizeWhatsappNumber(form.whatsappNumber) },
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
    const currentNumber = registeredWhatsappNumber || form.whatsappNumber;

    setIsChangingWhatsappNumber(true);
    setIsWhatsappVerified(false);
    setForm((current) => ({ ...current, whatsappNumber: currentNumber }));
    setChangeWhatsappSessionId("");
    setOtp("");
    setOtpSent(false);
    setOtpError("");
    window.setTimeout(() => {
      whatsappInputRef.current?.focus();
      whatsappInputRef.current?.select();
    }, 0);
  }

  function handleWhatsappInputBlur() {
    if (!isUnchangedWhatsappNumber) return;

    setIsChangingWhatsappNumber(false);
    setIsWhatsappVerified(true);
    setChangeWhatsappSessionId("");
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

  async function handlePrasadChange(checked: boolean) {
    updateField("wantsPrasad", checked);
    if (!checked) return;

    const savedAddress = await getSavedAddress();
    setHasLoadedSavedAddress(true);
    if (!savedAddress) return;

    setForm((current) => ({
      ...current,
      houseNo: savedAddress.houseNo || "",
      streetName: savedAddress.streetName || "",
      pincode: savedAddress.pincode || "",
      district: savedAddress.district || "",
      deliveryState: savedAddress.state || "",
      phoneNumber: savedAddress.phoneNumber || "",
    }));
  }
  function addDevotee() {
    if (additionalDevotees.length >= 3) return;
    setAdditionalDevotees((current) => [
      ...current,
      { id: crypto.randomUUID(), name: "", naal: "" },
    ]);
  }

  function updateAdditionalDevotee(
    id: string,
    field: "name" | "naal",
    value: string,
  ) {
    setAdditionalDevotees((current) =>
      current.map((devotee) =>
        devotee.id === id ? { ...devotee, [field]: value } : devotee,
      ),
    );
  }

  function removeDevotee(id: string) {
    setAdditionalDevotees((current) =>
      current.filter((devotee) => devotee.id !== id),
    );
  }

  function handleToggleOffering(offeringId: string) {
    const offering = offerings.find((item) => item.slug === offeringId);
    if (!offering?.isActive) return;

    setSelectedOfferingIds((current) =>
      current.includes(offeringId)
        ? current.filter((id) => id !== offeringId)
        : [...current, offeringId],
    );
  }

  function handleDakshinaChange(value: string) {
    if (!/^\d*(?:\.\d{0,2})?$/.test(value)) return;
    if (value !== "" && Number(value) < 0) return;

    setDakshinaAmount(value);
  }

  function handleContinueToOfferings() {
    setHasTriedContinue(true);

    const validationError = getBookingValidationError();
    if (validationError) {
      showToast("error", validationError);
      return;
    }

    navigateToCheckoutStep("offerings");
  }

  function handleContinueFromOfferings() {
    if (
      !Number.isFinite(normalizedDakshinaAmount) ||
      normalizedDakshinaAmount < 0
    ) {
      showToast("error", bookingText.invalidDakshina);
      return;
    }

    void handleContinueToPayment();
  }

  async function handleUseCurrentLocation() {
    setIsDetectingLocation(true);
    setLocationError("");

    try {
      const location = await getCurrentLocationAddress();
      setForm((current) => ({
        ...current,
        state: current.state || (location.state ?? current.state),
        deliveryState: location.state ?? current.deliveryState,
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
    if (!checkoutWhatsappNumber) return bookingText.validationWhatsapp;
    if (!hasVerifiedWhatsapp) return bookingText.validationWhatsappVerify;
    if (!form.state.trim()) return bookingText.validationState;
    if (!form.naal.trim()) {
      return astrologicalFieldPlaceholder;
    }
    if (additionalDevotees.some((devotee) => !devotee.name.trim())) {
      return "Enter a name for every devotee.";
    }
    if (additionalDevotees.some((devotee) => !devotee.naal.trim())) {
      return `Select or enter ${astrologicalFieldLabel.toLowerCase()} for every devotee.`;
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
      const nextSession = await createBackendPaymentSession(bookingPayload);
      setPaymentSession(nextSession);
      navigateToCheckoutStep("payment");
    } catch (createError: unknown) {
      const message = getErrorMessage(
        createError,
        bookingText.bookingCreateError,
      );
      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes("offering") &&
        normalizedMessage.includes("unavailable")
      ) {
        navigateToCheckoutStep("offerings", { replace: true });
        await refreshOfferings(true);
      } else {
        showToast("error", message);
      }
    } finally {
      setIsCreatingPayment(false);
    }
  }

  function handleBackendPaymentDone() {
    if (!paymentSession || isProcessingPayment) return;

    setIsProcessingPayment(true);
    navigateToCheckoutStep("success");
    setIsProcessingPayment(false);
  }

  function handleBackToVerification() {
    navigateBackToCheckoutStep("auth");
  }
  function handleBackToDetails() {
    navigateBackToCheckoutStep("details");
  }
  function handleBackToOfferings() {
    navigateBackToCheckoutStep("offerings");
  }
  function handleStateChange(value: string) {
    setForm((current) => ({
      ...current,
      state: value,
      district: "",
      naal: "",
    }));
    setAdditionalDevotees((current) =>
      current.map((devotee) => ({ ...devotee, naal: "" })),
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-4 bg-[#fbfbfd] text-[#061b4d]/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-medium">
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
    <main className="min-h-screen min-w-0 overflow-x-clip bg-[#fbfbfd] text-[#061b4d]">
      <style jsx global>{`
        body > header,
        body > footer,
        .site-layout-footer,
        .site-mobile-bottom-nav {
          display: none !important;
        }

        @keyframes bookingCaretPulse {
          0%,
          100% {
            caret-color: #ef7d1a;
          }

          50% {
            caret-color: #111827;
          }
        }

        @keyframes bookingSelectDrop {
          from {
            opacity: 0;
            transform: translateY(-0.35rem) scaleY(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }

        .booking-floating-form label:has(input),
        .booking-floating-form label:has([data-floating-select]) {
          position: relative;
          display: block;
        }

        .booking-floating-form label:has(input) > span:first-child,
        .booking-floating-form
          label:has([data-floating-select])
          > span:first-child {
          position: absolute;
          left: 0.875rem;
          top: 1rem;
          z-index: 1;
          max-width: calc(100% - 1.75rem);
          background: #fff;
          padding: 0 0.25rem;
          color: #7d86a0;
          font-size: 0.875rem;
          line-height: 1rem;
          transform-origin: left center;
          transition:
            top 180ms ease,
            color 180ms ease,
            font-size 180ms ease;
        }

        .booking-floating-form label:has(input) input,
        .booking-floating-form
          label:has([data-floating-select])
          [data-floating-select] {
          height: 3.25rem !important;
          margin-top: 0 !important;
          padding-bottom: 0 !important;
          padding-top: 0 !important;
        }

        .booking-floating-form label:has(input) input {
          animation: bookingCaretPulse 3s ease-in-out infinite;
          caret-color: #ef7d1a;
          line-height: 1.25rem !important;
          transition:
            border-color 260ms ease,
            box-shadow 260ms ease,
            color 260ms ease;
        }

        .booking-floating-form label:has(input) input::placeholder {
          color: transparent !important;
        }

        .booking-floating-form
          label:has([data-floating-select])
          > span:first-child {
          top: -0.375rem;
          color: #ef7d1a;
          font-size: 0.6875rem;
        }

        .booking-select-menu {
          animation: bookingSelectDrop 180ms ease-out;
          transform-origin: top center;
        }

        .booking-floating-form label:has(input:focus) > span:first-child,
        .booking-floating-form
          label:has(input:not(:placeholder-shown))
          > span:first-child,
        .booking-floating-form
          label:has([data-floating-select]:focus)
          > span:first-child,
        .booking-floating-form
          label:has([data-floating-select][data-has-value="true"])
          > span:first-child {
          top: -0.375rem;
          color: #ef7d1a;
          font-size: 0.6875rem;
        }
      `}</style>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dde2ec] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex min-h-14 max-w-295 items-center justify-between gap-3 px-3 sm:px-6 md:h-16">
          <Link
            href={APP_ROUTES.home}
            aria-label="Yaagam home"
            className="block"
          >
            <Image
              src="/logo_png.png"
              width={56}
              height={56}
              alt="Yaagam"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div
            className={cn(
              "mx-auto hidden w-full max-w-[1000px] flex-1 grid-cols-5 items-start gap-0 px-4 md:grid",
              checkoutStep === "payment" && "max-w-290 grid-cols-4",
            )}
          >
            {bookingSteps.map((step, index) => {
              if (checkoutStep === "payment" && index >= 4) return null;
              return (
                <div
                  key={step}
                  className="relative flex min-w-0 flex-col items-center text-center"
                >
                  {index < bookingSteps.length - 1 && (
                    <span
                      className={`absolute left-1/2 top-2.75 h-px w-full ${
                        index < activeStepIndex
                          ? "bg-[#ef7d1a]"
                          : "bg-[#dfe4ec]"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-5.5 w-5.5 items-center justify-center rounded-full border text-[9px] font-semibold ${
                      index <= activeStepIndex
                        ? "border-[#ef7d1a] bg-[#ef7d1a] text-white"
                        : "border-[#cbd3df] bg-white text-[#8791a5]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`mt-1.5 w-full px-0.5 text-[9px] font-medium leading-3 ${
                      index <= activeStepIndex
                        ? "text-[#ef7d1a]"
                        : "text-[#6f7890]"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
          <LanguageSelector className="h-8 rounded-full border border-[#d8deea] px-2 text-[11px] font-semibold text-[#061b4d]" />
        </div>
      </header>
      <div className="border-b border-[#eef1f5] bg-white pt-14 md:hidden">
        <div className="mx-auto grid w-full max-w-[500px] grid-cols-5 items-start gap-0 px-1 pb-2.5 pt-2">
          {bookingSteps.map((step, index) => {
            if (checkoutStep === "payment" && index >= 4) return null;
            return (
              <div
                key={step}
                className="relative flex min-w-0 flex-col items-center text-center"
              >
                {index < bookingSteps.length - 1 && (
                  <span
                    className={`absolute left-1/2 top-2.75 h-px w-full ${
                      index < activeStepIndex ? "bg-[#ef7d1a]" : "bg-[#dfe4ec]"
                    }`}
                  />
                )}

                <span
                  className={`relative z-10 flex h-5.5 w-5.5 items-center justify-center rounded-full border text-[9px] font-semibold ${
                    index <= activeStepIndex
                      ? "border-[#ef7d1a] bg-[#ef7d1a] text-white"
                      : "border-[#cbd3df] bg-white text-[#8791a5]"
                  }`}
                >
                  {index + 1}
                </span>

                <span
                  className={`mt-1.5 w-full px-0.5 text-[8px] font-medium leading-3 sm:text-[9px] ${
                    index <= activeStepIndex
                      ? "text-[#ef7d1a]"
                      : "text-[#6f7890]"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <section
        className={cn(
          `mx-auto grid w-full min-w-0 gap-12 pb-28 pt-6 sm:pt-10 md:pt-24 lg:pb-12`,
          checkoutStep === "payment"
            ? "max-w-none px-0"
            : "max-w-290 px-5 lg:grid-cols-[620px_320px] lg:justify-between",
        )}
      >
        {checkoutStep === "auth" ? (
          <div className="min-w-0 rounded-2xl border border-[#e5e9f2] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-8">
            <h1 className="text-[20px] font-extrabold leading-6 text-[#061b4d]">
              {bookingText.whatsappLoginTitle}
            </h1>
            <p className="mt-1.5 text-[13px] font-semibold text-[#7d86a0]">
              {bookingText.whatsappLoginDesc}
            </p>
            <div className="mb-6 mt-6 border-b border-[#f0f2f7]" />
            <div className="space-y-4">
              <div>
                <FieldLabel required>{bookingText.whatsappNumber}</FieldLabel>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <label className="block min-w-0">
                    <WhatsappPhoneInput
                      inputRef={whatsappInputRef}
                      name="whatsappNumber"
                      required
                      readOnly={hasVerifiedWhatsapp}
                      invalid={isRequiredFieldInvalid(form.whatsappNumber)}
                      value={
                        hasVerifiedWhatsapp
                          ? formatWhatsappDisplayNumber(
                              authWhatsappNumber ||
                                form.whatsappNumber ||
                                getClientWhatsappNumber(),
                            )
                          : form.whatsappNumber
                      }
                      onChange={handleWhatsAppNumberChange}
                      onBlur={handleWhatsappInputBlur}
                      inputClassName={cn(
                        inputClassName(
                          isRequiredFieldInvalid(form.whatsappNumber),
                        ),
                        "mt-0 h-12 rounded-l-none rounded-r-xl",
                        hasVerifiedWhatsapp &&
                          "cursor-not-allowed bg-[#f8fafc] text-[#4f5972]",
                      )}
                    />
                  </label>
                  {hasVerifiedWhatsapp && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleChangeWhatsappNumber}
                      className="h-12 rounded-xl border-[#ef7d1a] px-5 text-[12px] font-semibold text-[#ef7d1a] hover:bg-[#fff4e8]"
                    >
                      {bookingText.changeWhatsappNumber}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-[#d7f0dd] bg-[#f0fff4] px-4 py-3">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center">
                      <WhatsAppIcon variant="orange" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0d7d3c]">
                        {hasVerifiedWhatsapp
                          ? bookingText.whatsappVerified
                          : bookingText.verifyWhatsappNumber}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#51a46c]">
                        {hasVerifiedWhatsapp
                          ? bookingText.whatsappReady
                          : bookingText.whatsappOtpInfo}
                      </p>
                    </div>
                  </div>
                  {!hasVerifiedWhatsapp && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={requestBookingOtp}
                      disabled={isSendingOtp || isUnchangedWhatsappNumber}
                      className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-semibold text-[#ef7d1a] hover:bg-[#fff4e8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingOtp
                        ? bookingText.sending
                        : otpSent
                          ? bookingText.resendOtp
                          : bookingText.sendOtp}
                    </Button>
                  )}
                </div>

                {!hasVerifiedWhatsapp && otpSent && (
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                      className={[
                        "h-10 rounded-md px-4 text-center text-[16px] font-semibold tracking-[0.35em] shadow-none outline-none transition placeholder:text-[#667399]",
                        isRequiredFieldInvalid(otp)
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                          : "border-[#d9e0ed] focus:border-saffron focus:ring-2 focus:ring-saffron/10",
                      ].join(" ")}
                      inputMode="numeric"
                      name="otp"
                      required
                      placeholder="------"
                      value={otp}
                      onChange={(event) => handleOtpChange(event.target.value)}
                    />
                    <Button
                      type="button"
                      disabled={isVerifyingOtp}
                      onClick={verifyBookingOtp}
                      className="h-10 rounded-md bg-[#ef7d1a] px-5 text-[12px] font-semibold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifyingOtp
                        ? bookingText.verifying
                        : bookingText.verifyAndLogin}
                    </Button>
                  </div>
                )}

                {otpError && (
                  <p className="text-[10px] font-medium text-red-600">
                    {otpError}
                  </p>
                )}
              </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe4ec] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:static md:mt-8 md:border-t md:border-[#f0f2f7] md:bg-transparent md:p-0 md:pb-0 md:shadow-none md:flex md:justify-end md:pt-6">
              <Button
                type="button"
                disabled={!hasVerifiedWhatsapp}
                onClick={() => navigateToCheckoutStep("details")}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#ef7d1a] to-[#d96e13] px-8 text-[14px] font-semibold text-white shadow-none hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:h-11"
              >
                {bookingText.next}
              </Button>
            </div>
          </div>
        ) : checkoutStep === "offerings" ? (
          <OfferingSelectionStep
            offerings={offerings}
            selectedOfferingIds={selectedOfferingIds}
            dakshinaAmount={dakshinaAmount}
            totalAmount={displayedBookingTotal}
            language={dbLanguage}
            isLoading={isLoadingOfferings}
            error={offeringsError}
            text={bookingText}
            onToggleOffering={handleToggleOffering}
            onDakshinaChange={handleDakshinaChange}
            onRefresh={() => {
              void refreshOfferings();
            }}
            onBack={handleBackToDetails}
            onContinue={handleContinueFromOfferings}
          />
        ) : checkoutStep === "details" ? (
          <div className="min-w-0 rounded-2xl border border-[#e5e9f2] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-8">
            <form
              className="booking-floating-form space-y-6"
              data-payload={JSON.stringify(bookingPayload)}
            >
              <div className="mb-6 flex">
                <button
                  type="button"
                  onClick={handleBackToVerification}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#7d86a0] hover:text-[#ef7d1a] transition-colors"
                  aria-label="Back to verification"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  {bookingText.backToVerification}
                </button>
              </div>
              <div>
                <h1 className="text-[20px] font-extrabold leading-6 text-[#061b4d]">
                  {bookingText.detailsTitle}
                </h1>
                <p className="mt-1.5 text-[13px] font-semibold text-[#7d86a0]">
                  {bookingText.detailsSubtitle}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#f3d5b7] bg-[#fffaf4] p-4 sm:p-5 md:col-span-2">
                    <div className="mb-2">
                      <label className="block max-w-sm">
                        <FieldLabel required>{bookingText.state}</FieldLabel>
                        <FloatingSelect
                          className={selectClassName(
                            form.state,
                            isRequiredFieldInvalid(form.state),
                          )}
                          name="state"
                          placeholder={bookingText.selectState}
                          value={form.state}
                          options={INDIAN_STATES.map((state) => ({
                            label: state.name,
                            value: state.name,
                          }))}
                          onChange={handleStateChange}
                        />
                        <span className="mt-1.5 block text-[10px] font-semibold leading-4 text-[#7d86a0]">
                          {bookingText.stateHelpText}
                        </span>
                      </label>
                    </div>

                    <div className="rounded-xl border border-[#eadfd4] bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#061b4d]">
                          1 {bookingText.devoteeLabel}
                        </span>
                        <span className="rounded-full bg-[#fff4e8] px-2.5 py-1 text-[9px] font-semibold text-[#ef7d1a]">
                          {bookingText.included}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
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
                        <label className="block">
                          <FieldLabel required>
                            {astrologicalFieldLabel}
                          </FieldLabel>
                          {isSouthState ? (
                            <FloatingSelect
                              className={selectClassName(
                                form.naal,
                                isRequiredFieldInvalid(form.naal),
                              )}
                              name="naal"
                              placeholder={astrologicalFieldPlaceholder}
                              value={form.naal}
                              options={NAALS_SOUTH.map((naal) => ({
                                label: naal,
                                value: naal,
                              }))}
                              onBeforeOpen={() => {
                                if (form.state.trim()) return true;
                                showToast("error", bookingText.validationState);
                                return false;
                              }}
                              onChange={(value) => updateField("naal", value)}
                            />
                          ) : (
                            <Input
                              className={inputClassName(
                                isRequiredFieldInvalid(form.naal),
                              )}
                              name="gotra"
                              required
                              placeholder={astrologicalFieldPlaceholder}
                              value={form.naal}
                              onClick={() => {
                                if (!form.state.trim()) {
                                  showToast(
                                    "error",
                                    bookingText.validationState,
                                  );
                                }
                              }}
                              readOnly={!form.state.trim()}
                              onChange={(event) =>
                                updateField("naal", event.target.value)
                              }
                            />
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {additionalDevotees.map((devotee, index) => (
                        <div
                          key={devotee.id}
                          className="rounded-xl border border-[#eadfd4] bg-white p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#061b4d]">
                              {index + 2} {bookingText.devoteeLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDevotee(devotee.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
                              aria-label={`Remove additional devotee ${index + 1}`}
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />{" "}
                              {bookingText.remove}
                            </button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                              <FieldLabel required>
                                {bookingText.name}
                              </FieldLabel>
                              <Input
                                className={inputClassName(
                                  hasTriedContinue && !devotee.name.trim(),
                                )}
                                name={`additionalDevotee-${index}-name`}
                                placeholder={bookingText.namePlaceholder}
                                value={devotee.name}
                                onChange={(event) =>
                                  updateAdditionalDevotee(
                                    devotee.id,
                                    "name",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                            <label className="block">
                              <FieldLabel required>
                                {astrologicalFieldLabel}
                              </FieldLabel>
                              {isSouthState ? (
                                <FloatingSelect
                                  className={selectClassName(
                                    devotee.naal,
                                    hasTriedContinue && !devotee.naal.trim(),
                                  )}
                                  name={`additionalDevotee-${index}-naal`}
                                  placeholder={astrologicalFieldPlaceholder}
                                  value={devotee.naal}
                                  options={NAALS_SOUTH.map((naal) => ({
                                    label: naal,
                                    value: naal,
                                  }))}
                                  onBeforeOpen={() => {
                                    if (form.state.trim()) return true;
                                    showToast(
                                      "error",
                                      bookingText.validationState,
                                    );
                                    return false;
                                  }}
                                  onChange={(value) =>
                                    updateAdditionalDevotee(
                                      devotee.id,
                                      "naal",
                                      value,
                                    )
                                  }
                                />
                              ) : (
                                <Input
                                  className={inputClassName(
                                    hasTriedContinue && !devotee.naal.trim(),
                                  )}
                                  name={`additionalDevotee-${index}-gotra`}
                                  placeholder={astrologicalFieldPlaceholder}
                                  value={devotee.naal}
                                  onClick={() => {
                                    if (!form.state.trim()) {
                                      showToast(
                                        "error",
                                        bookingText.validationState,
                                      );
                                    }
                                  }}
                                  readOnly={!form.state.trim()}
                                  onChange={(event) =>
                                    updateAdditionalDevotee(
                                      devotee.id,
                                      "naal",
                                      event.target.value,
                                    )
                                  }
                                />
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={additionalDevotees.length >= 3}
                      onClick={addDevotee}
                      className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ef7d1a] bg-white text-[12px] font-semibold text-[#ef7d1a] transition hover:bg-[#fff4e8] disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {additionalDevotees.length >= 3
                        ? bookingText.maxDevotees
                        : bookingText.addAnotherDevotee}
                    </button>
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1df] px-3 py-2.5 text-[10px] font-medium leading-4 text-[#8a5725]">
                      <span aria-hidden="true">{bookingText.inr}</span>
                      {bookingText.additionalDevoteeInfo}
                    </p>
                  </div>

                  <label className="block md:col-span-2">
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
                    onClick={() => void handlePrasadChange(!form.wantsPrasad)}
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
                      <span className="block text-[11px] font-semibold leading-4 text-[#111827] sm:text-[13px] sm:leading-4">
                        {bookingText.prasadQuestion}
                      </span>
                    </span>
                  </button>
                  <div className="w-full sm:w-auto sm:shrink-0">
                    <PrasadToggle
                      checked={form.wantsPrasad}
                      yesLabel={bookingText.yes}
                      noLabel={bookingText.no}
                      onChange={(checked) => void handlePrasadChange(checked)}
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
                <div
                  className={
                    form.wantsPrasad ? "overflow-visible" : "overflow-hidden"
                  }
                >
                  <div className="mb-4 mt-4 px-1">
                    <h3 className="text-[14px] font-semibold text-[#061b4d]">
                      {bookingText.deliveryLocation}
                    </h3>
                    <p className="mt-0.5 text-[10px] font-medium text-[#4f5972]">
                      {bookingText.deliveryLocationDesc}
                    </p>
                  </div>
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
                          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#ef7d1a] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Navigation className="h-6 w-6" />
                          {isDetectingLocation
                            ? bookingText.gettingLocation
                            : bookingText.useCurrentLocation}
                        </button>
                        {locationError && (
                          <p className="max-w-52 text-[10px] font-medium leading-4 text-red-600">
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
                      <FieldLabel required>{bookingText.state}</FieldLabel>
                      <FloatingSelect
                        className={selectClassName(
                          form.deliveryState,
                          isRequiredFieldInvalid(form.deliveryState),
                        )}
                        name="deliveryState"
                        placeholder={bookingText.selectState}
                        value={form.deliveryState}
                        options={INDIAN_STATES.map((state) => ({
                          label: state.name,
                          value: state.name,
                        }))}
                        onChange={(value) => {
                          updateField("deliveryState", value);
                          updateField("district", "");
                        }}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>{bookingText.district}</FieldLabel>
                      <FloatingSelect
                        className={selectClassName(
                          form.district,
                          isRequiredFieldInvalid(form.district),
                        )}
                        name="district"
                        placeholder={bookingText.selectDistrict}
                        value={form.district}
                        options={districts.map((district) => ({
                          label: district,
                          value: district,
                        }))}
                        onBeforeOpen={() => {
                          if (form.deliveryState.trim()) return true;
                          showToast("error", bookingText.validationState);
                          return false;
                        }}
                        onChange={(value) => updateField("district", value)}
                      />
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
          paymentSession ? (
            <PaymentMethodPage
              session={{
                ...paymentSession,
                kind: selectedPlan === "weekly" ? "subscription" : "single",
              }}
              isProcessingPayment={isProcessingPayment}
              onBack={handleBackToOfferings}
              onComplete={handleBackendPaymentDone}
            />
          ) : (
            <div
              className="h-[34rem] animate-pulse rounded-[2rem] bg-slate-200/70"
              aria-label="Loading payment"
            />
          )
        ) : null}

        <div
          className={cn(
            "min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start",
            checkoutStep === "payment" && "hidden",
          )}
        >
          <aside className="overflow-hidden rounded-xl border border-[#e5e9f2] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <details className="group">
              <summary className="cursor-pointer list-none p-4 marker:content-none">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[13px] font-semibold text-[#061b4d]">
                    {bookingText.bookingSummary}
                  </h2>
                  <ChevronDown className="h-4 w-4 text-[#6f7890] transition-transform group-open:rotate-180" />
                </div>
                <div className="mt-3 grid grid-cols-[56px_1fr] items-center gap-3">
                  <div className="relative h-14 overflow-hidden rounded-md bg-[#f4f4f4]">
                    <Image
                      src={summary.image}
                      alt={summary.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-[11px] font-semibold text-[#061b4d]">
                      {summary.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-3.5 text-[#6b748c]">
                      {[summary.templeName, summary.templePlace]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </summary>

              <div className="space-y-3 border-t border-[#eef1f5] px-4 py-3 text-[11px] font-medium text-[#6f7890]">
                <p className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {bookingText.poojaDay}
                  </span>
                  <span className="text-right text-[#061b4d]">
                    {summary.poojaDayLabel}
                  </span>
                </p>
                {summary.poojaTime && (
                  <p className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {bookingText.poojaTime}
                    </span>
                    <span className="text-right text-[#061b4d]">
                      {summary.poojaTime}
                    </span>
                  </p>
                )}
                <p className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <Home className="h-3.5 w-3.5" />
                    {bookingText.planType}
                  </span>
                  <span className="text-[#ef7d1a]">{summary.planName}</span>
                </p>
              </div>
            </details>
          </aside>
          {checkoutStep === "offerings" && (
            <div className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-xl border border-[#e5e9f2] bg-white text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] lg:hidden">
              <p className="px-2 py-3 text-[10px] font-semibold text-[#7d86a0]">
                Pooja
                <span className="mt-0.5 block font-extrabold text-[#061b4d]">
                  {"\u20B9"}
                  {formatAmount(displayedPriceBreakdown.poojaAmount)}
                </span>
              </p>
              {displayedPriceBreakdown.offeringTotal > 0 && (
                <p className="border-l border-[#eef1f5] px-2 py-3 text-[10px] font-semibold text-[#7d86a0]">
                  Offerings
                  <span className="mt-0.5 block font-extrabold text-[#061b4d]">
                    {"\u20B9"}
                    {formatAmount(displayedPriceBreakdown.offeringTotal)}
                  </span>
                </p>
              )}
              {displayedPriceBreakdown.dakshina > 0 && (
                <p className="border-l border-[#eef1f5] px-2 py-3 text-[10px] font-semibold text-[#7d86a0]">
                  Dakshina
                  <span className="mt-0.5 block font-extrabold text-[#061b4d]">
                    {"\u20B9"}
                    {formatAmount(displayedPriceBreakdown.dakshina)}
                  </span>
                </p>
              )}
            </div>
          )}

          {checkoutStep === "offerings" && (
            <div className="hidden rounded-2xl border border-[#e5e9f2] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] lg:block">
              <div className="space-y-3 rounded-xl bg-[#f4f4f4] px-4 py-4 text-[12px] font-semibold text-[#657087]">
                <p className="flex justify-between gap-4">
                  <span>
                    Pooja amount
                    {devoteeCount > 1 && (
                      <small className="mt-0.5 block text-[9px] font-semibold text-[#8a92a5]">
                        {formatAmount(displayedPriceBreakdown.poojaUnitAmount)}{" "}
                        x {devoteeCount} {bookingText.devoteeLabel}
                      </small>
                    )}
                  </span>
                  <span className="font-extrabold text-[#061b4d]">
                    {"\u20B9"}
                    {formatAmount(displayedPriceBreakdown.poojaAmount)}
                  </span>
                </p>
                {displayedPriceBreakdown.offeringTotal > 0 && (
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p>Offerings</p>
                      {selectedOfferingNames.length > 0 && (
                        <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-4 text-[#8a92a5]">
                          {selectedOfferingNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-extrabold text-[#061b4d]">
                      {"\u20B9"}
                      {formatAmount(displayedPriceBreakdown.offeringTotal)}
                    </span>
                  </div>
                )}
                {displayedPriceBreakdown.dakshina > 0 && (
                  <p className="flex justify-between gap-4">
                    <span>Additional Dakshina</span>
                    <span className="font-extrabold text-[#061b4d]">
                      {"\u20B9"}
                      {formatAmount(displayedPriceBreakdown.dakshina)}
                    </span>
                  </p>
                )}
                <p className="flex justify-between gap-4 border-t border-[#d9dce2] pt-3 text-[13px] font-semibold text-[#061b4d]">
                  <span>Total</span>
                  <span>
                    {"\u20B9"}
                    {formatAmount(displayedBookingTotal)}
                  </span>
                </p>
              </div>
              <div className="mt-5 flex h-6 items-center justify-center gap-1.5 rounded-t-lg bg-[#22ad64] text-[10px] font-medium text-white">
                <Lock className="h-3 w-3" />
                100% Secure Payment
              </div>
              <Button
                type="button"
                onClick={handleContinueFromOfferings}
                className="h-12 w-full rounded-t-none rounded-b-lg bg-gradient-to-r from-gradient-start to-gradient-end text-[14px] font-semibold text-white hover:opacity-95"
              >
                {bookingText.continueToPayment}
              </Button>
            </div>
          )}
          {checkoutStep === "details" && (
            <div>
              <div className="mb-5 rounded-xl bg-[#f4f4f4] px-4 py-4 text-[12px] font-semibold text-[#657087]">
                <div className="space-y-3">
                  <p className="flex justify-between gap-4">
                    <span>
                      Pooja amount
                      {devoteeCount > 1 && (
                        <small className="mt-0.5 block text-[9px] font-semibold text-[#8a92a5]">
                          {formatAmount(
                            displayedPriceBreakdown.poojaUnitAmount,
                          )}{" "}
                          x {devoteeCount} {bookingText.devoteeLabel}
                        </small>
                      )}
                    </span>
                    <span className="font-extrabold text-[#061b4d]">
                      {"\u20B9"}
                      {formatAmount(displayedPriceBreakdown.poojaAmount)}
                    </span>
                  </p>
                  {displayedPriceBreakdown.offeringTotal > 0 && (
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p>Offerings</p>
                        {selectedOfferingNames.length > 0 && (
                          <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-4 text-[#8a92a5]">
                            {selectedOfferingNames.join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-extrabold text-[#061b4d]">
                        {"\u20B9"}
                        {formatAmount(displayedPriceBreakdown.offeringTotal)}
                      </span>
                    </div>
                  )}
                  {displayedPriceBreakdown.dakshina > 0 && (
                    <p className="flex justify-between gap-4">
                      <span>Additional Dakshina</span>
                      <span className="font-extrabold text-[#061b4d]">
                        {"\u20B9"}
                        {formatAmount(displayedPriceBreakdown.dakshina)}
                      </span>
                    </p>
                  )}
                  <p className="flex justify-between gap-4 border-t border-[#d9dce2] pt-3 text-[13px] font-semibold text-[#061b4d]">
                    <span>Total</span>
                    <span>
                      {"\u20B9"}
                      {formatAmount(displayedBookingTotal)}
                    </span>
                  </p>
                </div>
              </div>
              <p className="mb-7 flex items-center gap-2 text-[10px] font-semibold text-[#8a92a5]">
                <Lock className="h-3.5 w-3.5" />
                {bookingText.informationSecure}
              </p>
              <div className="grid gap-3">
                <Button
                  type="button"
                  disabled={!hasVerifiedWhatsapp || isCreatingPayment}
                  onClick={handleContinueToOfferings}
                  className="hidden h-12 w-full rounded-lg bg-gradient-to-r from-gradient-start to-gradient-end text-[13px] font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
                >
                  {!hasVerifiedWhatsapp
                    ? bookingText.verifyWhatsappToContinue
                    : bookingText.next}
                  <ArrowRight className="motion-arrow-right h-6 w-6" />
                </Button>
              </div>
              <div className="mt-4 rounded-md bg-[#fff4e8] p-4">
                <p className="text-[12px] font-semibold text-[#ef7d1a]">
                  {bookingText.whatIsIncluded}
                </p>
                <div className="mt-3 space-y-2 text-[10px] font-medium text-[#4f5972]">
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
              <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe4ec] bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] lg:hidden">
                <div className="flex h-5 items-center justify-center gap-1 bg-[#22ad64] text-[10px] font-medium text-white">
                  <Lock className="h-3 w-3" />
                  100% Secure Payment
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold text-[#7d86a0]">
                      Total Dakshina
                    </p>
                    <p className="text-[16px] font-semibold text-[#061b4d]">
                      {"\u20B9"}
                      {formatAmount(displayedBookingTotal)}/-
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={!hasVerifiedWhatsapp || isCreatingPayment}
                    onClick={handleContinueToOfferings}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end text-[14px] font-semibold text-white shadow-none hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {!hasVerifiedWhatsapp
                      ? bookingText.verifyWhatsappToContinue
                      : bookingText.next}
                    <ArrowRight className="motion-arrow-right h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <BookingSuccessModal
        open={checkoutStep === "success"}
        summary={summary}
        paymentSession={paymentSession}
        text={bookingText}
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
