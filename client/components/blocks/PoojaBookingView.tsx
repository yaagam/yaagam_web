"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { City, State } from "country-state-city";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Heart,
  Home,
  Lock,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

import { LanguageSelector } from "@/components/ui/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES, PLACEHOLDER_ROUTE } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import { getErrorMessage } from "@/lib/utils";

type PoojaBookingViewProps = {
  poojaId: string;
  plan?: string;
};

type DbLanguage = PoojaTranslation["language"];

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
  const [error, setError] = useState("");

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

  const isSouthState = southIndianStates.has(form.state);
  const naalFieldLabel = isSouthState ? "Naal" : "Gothra";
  const stateIsoCode = getStateIsoCode(form.state);
  const districts = useMemo(() => {
    if (!stateIsoCode) return [];

    return Array.from(
      new Set(City.getCitiesOfState("IN", stateIsoCode).map((city) => city.name)),
    ).sort((first, second) => first.localeCompare(second));
  }, [stateIsoCode]);

  const bookingPayload = useMemo(
    () => ({
      poojaId,
      plan: plan === "weekly" ? "weekly" : "single",
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
          }
        : null,
    }),
    [form, plan, poojaId],
  );

  function updateField<K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
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
          <Link href={APP_ROUTES.home} aria-label="Yaagam home" className="block">
            <Image src="/logo_png.png" width={72} height={72} alt="Yaagam" />
          </Link>
          <LanguageSelector className="h-9 rounded-full border border-[#d8deea] px-2 text-[12px] font-extrabold text-[#061b4d]" />
        </div>
      </header>

      <section className="mx-auto max-w-[1160px] px-5 pt-10">
        <div className="grid grid-cols-5 items-start gap-5">
          {steps.map((step, index) => (
            <div key={step} className="relative flex flex-col items-center text-center">
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
                  index === 0 ? "text-[#ef7d1a]" : "text-[#7a849d]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1160px] gap-12 px-5 pb-12 pt-20 lg:grid-cols-[620px_320px] lg:justify-between">
        <form className="space-y-5" data-payload={JSON.stringify(bookingPayload)}>
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
                  updateField("whatsappNumber", event.target.value)
                }
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-5 rounded-md border border-[#d7f0dd] bg-[#f0fff4] px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#20b15a] text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[12px] font-extrabold text-[#0d7d3c]">
                  Verify WhatsApp Number
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-[#51a46c]">
                  We will send an OTP to your WhatsApp number for verification.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8]"
            >
              Send OTP
            </Button>
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
                onChange={(event) => updateField("nakshatra", event.target.value)}
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
                  onChange={(event) => updateField("naal", event.target.value)}
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
                  onChange={(event) => updateField("naal", event.target.value)}
                />
              )}
            </label>

            <label className="block">
              <FieldLabel>Special Request <span className="text-[#7d86a0]">(Optional)</span></FieldLabel>
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
                  onChange={(event) => updateField("houseNo", event.target.value)}
                />
              </label>

              <div className="flex items-end justify-center md:justify-start">
                <button
                  type="button"
                  className="mb-1 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#ef7d1a]"
                >
                  <Navigation className="h-6 w-6" />
                  Use current location
                </button>
              </div>

              <label className="block">
                <FieldLabel required>Road Name/ Street Name / landmark</FieldLabel>
                <Input
                  className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                  name="streetName"
                  placeholder="Enter Road Name / Street Na..."
                  value={form.streetName}
                  onChange={(event) => updateField("streetName", event.target.value)}
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
                  onChange={(event) => updateField("pincode", event.target.value)}
                />
              </label>

              <label className="block">
                <FieldLabel required>District</FieldLabel>
                <select
                  className={selectClassName(form.district)}
                  name="district"
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
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
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                />
              </label>
            </div>
          )}
        </form>

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
                {[summary.templeName, summary.templePlace].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-[12px] font-bold text-[#6f7890]">
            <p className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#8f98ad]" />
                Pooja Day
              </span>
              <span className="text-right text-[#061b4d]">{summary.nextDate}</span>
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
            <span className="text-lg text-[#ef7d1a]">Rs.{formatAmount(summary.amount)}</span>
          </p>

          <div className="mt-4 rounded-md bg-[#fff4e8] p-4">
            <p className="text-[12px] font-extrabold text-[#ef7d1a]">
              What is Included
            </p>
            <div className="mt-3 space-y-2 text-[10px] font-bold text-[#4f5972]">
              {["Prasadam", "Photos & Video on WhatsApp"].map((item) => (
                <p key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                  {item}
                </p>
              ))}
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
            Your information is secure and will only be used for pooja purpose.
          </p>
          <Button type="button" className="h-12 w-full rounded-lg bg-[#ef7d1a] text-[13px] font-extrabold text-white hover:bg-[#d96e13]">
            Continue to Payment
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