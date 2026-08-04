"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Gift, Loader2, Lock, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Offering,
  OfferingTranslation,
} from "@/lib/api/offering/offerings.api";
import type { PoojaLanguage } from "@/lib/api/pooja/poojas.api";
import type { BookingCopy } from "@/translations/booking-copy";

type OfferingSelectionStepProps = {
  offerings: Offering[];
  selectedOfferingIds: string[];
  dakshinaAmount: string;
  totalAmount: number;
  language: PoojaLanguage;
  isLoading: boolean;
  error: string;
  text: BookingCopy;
  onToggleOffering: (offeringId: string) => void;
  onDakshinaChange: (value: string) => void;
  onRefresh: () => void;
  onContinue: () => void;
};

const DAKSHINA_PRESETS = ["101", "201", "501", "1001"] as const;

function getTranslation(
  translations: OfferingTranslation[],
  language: PoojaLanguage,
) {
  return (
    translations.find((translation) => translation.language === language) ??
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDisplayPrice(offering: Offering) {
  const discountPrice = Number(offering.discountPrice);

  return discountPrice > 0 ? discountPrice : offering.actualPrice;
}

export function OfferingSelectionStep({
  offerings,
  selectedOfferingIds,
  dakshinaAmount,
  totalAmount,
  language,
  isLoading,
  error,
  text,
  onToggleOffering,
  onDakshinaChange,
  onRefresh,
  onContinue,
}: OfferingSelectionStepProps) {
  const isPresetAmount = DAKSHINA_PRESETS.includes(
    dakshinaAmount as (typeof DAKSHINA_PRESETS)[number],
  );
  const [isCustomDakshinaOpen, setIsCustomDakshinaOpen] = useState(
    dakshinaAmount !== "0" && dakshinaAmount !== "" && !isPresetAmount,
  );

  function selectDakshinaPreset(amount: string) {
    onDakshinaChange(amount);
    setIsCustomDakshinaOpen(false);
  }

  return (
    <section className="rounded-2xl border border-[#e5e9f2] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-8">
      {(isLoading || Boolean(error) || offerings.length > 0) && (
        <>
      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-[#7d86a0]">
          <Loader2 className="h-5 w-5 animate-spin text-saffron" />
          {text.loadingOfferings}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
            onClick={onRefresh}
          >
            {text.retryOfferings}
          </Button>
        </div>
      ) : offerings.length > 0 ? (
        <div className="mt-7 divide-y divide-[#edf0f6]">
          {offerings.map((offering) => {
            const translation = getTranslation(offering.translations, language);
            const selected = selectedOfferingIds.includes(offering.slug);
            const displayPrice = getDisplayPrice(offering);
            const hasDiscount =
              Number(offering.discountPrice) > 0 &&
              Number(offering.discountPrice) < Number(offering.actualPrice);

            return (
              <article
                key={offering.slug}
                className="grid grid-cols-[minmax(0,1fr)_106px] gap-4 py-5 first:pt-0 sm:grid-cols-[minmax(0,1fr)_124px] sm:gap-7"
              >
                <div className="min-w-0">
                  <h2 className="text-[15px] font-extrabold leading-5 text-[#061b4d]">
                    {translation?.name ?? text.offering}
                  </h2>
                  <p className="mt-1.5 text-[12px] font-medium leading-[18px] text-[#6f7890]">
                    {translation?.description ?? ""}
                  </p>
                  {hasDiscount && (
                    <span className="mt-2 inline-flex rounded-sm bg-[#e5a900] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                      {text.mostOffered}
                    </span>
                  )}
                  <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
                    {hasDiscount && (
                      <span className="text-[11px] font-semibold text-[#7d86a0] line-through">
                        {"\u20B9"}
                        {formatAmount(offering.actualPrice)}
                      </span>
                    )}
                    <span className="text-[14px] font-extrabold text-[#061b4d]">
                      {"\u20B9"}
                      {formatAmount(displayPrice)}/-
                    </span>
                  </div>
                </div>

                <div className="relative pb-5">
                  <div
                    className={`relative h-[106px] overflow-hidden rounded-2xl border bg-[#fff8f2] sm:h-[124px] ${
                      selected ? "border-saffron" : "border-[#f2d8c8]"
                    }`}
                  >
                    {offering.imageUrl ? (
                      <Image
                        src={offering.imageUrl}
                        alt={translation?.name ?? text.offering}
                        fill
                        unoptimized={offering.imageUrl.startsWith("http")}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Gift className="h-9 w-9 text-saffron/45" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!offering.isActive}
                    aria-pressed={selected}
                    onClick={() => onToggleOffering(offering.slug)}
                    className={`absolute -bottom-0.5 left-2 right-2 flex h-9 items-center justify-center gap-1 rounded-lg border bg-white text-[12px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-[#159447] text-[#159447]"
                        : "border-saffron text-saffron hover:bg-[#fff6ed]"
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        {text.added}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 stroke-[3]" />
                        {text.add}
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[#d9e0ed] bg-[#f8fafc] p-7 text-center">
          <Gift className="mx-auto h-8 w-8 text-saffron/55" />
          <p className="mt-3 text-sm font-bold text-[#6f7890]">
            {text.noOfferings}
          </p>
        </div>
      )}

        </>
      )}

      <section className="mt-7 rounded-2xl border border-[#dfe3e8] p-4 sm:p-5">
        <h2 className="text-[16px] font-extrabold text-[#061b4d]">
          {text.addDakshinaForPooja} {"\u{1F64F}"}
        </h2>
        <span className="mt-2 block h-0.5 w-24 bg-saffron" />

        <div className="mt-4 flex flex-wrap gap-2.5">
          {DAKSHINA_PRESETS.map((amount) => {
            const selected = dakshinaAmount === amount;

            return (
              <button
                key={amount}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  selected
                    ? onDakshinaChange("0")
                    : selectDakshinaPreset(amount)
                }
                className={`relative inline-flex min-w-[62px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-extrabold transition ${
                  selected
                    ? "border-saffron bg-[#fff7ed] text-[#061b4d]"
                    : "border-[#dfe3e8] bg-white text-[#061b4d] hover:border-saffron/60"
                }`}
              >
                {amount === "201" && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-[#e5a900] px-1.5 py-0.5 text-[8px] uppercase text-white">
                    {text.popular}
                  </span>
                )}
                {"\u20B9"}
                {amount}
                {selected && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-saffron text-white shadow-sm">
                    <X className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            aria-expanded={isCustomDakshinaOpen}
            onClick={() => {
              if (isCustomDakshinaOpen) {
                setIsCustomDakshinaOpen(false);
                onDakshinaChange("0");
                return;
              }

              setIsCustomDakshinaOpen(true);
            }}
            className="relative inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#dfe3e8] bg-white px-4 py-2 text-[13px] font-extrabold text-[#061b4d] hover:border-saffron/60"
          >
            {!isCustomDakshinaOpen && <Plus className="h-4 w-4" />}
            {text.addYourOwn}
            {isCustomDakshinaOpen && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-saffron text-white shadow-sm">
                <X className="h-3 w-3 stroke-[3]" />
              </span>
            )}
          </button>
        </div>

        {isCustomDakshinaOpen && (
          <label className="mt-4 block max-w-xs">
            <span className="sr-only">{text.dakshinaAmount}</span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              name="dakshinaAmount"
              value={dakshinaAmount === "0" ? "" : dakshinaAmount}
              placeholder={text.customDakshinaPlaceholder}
              onChange={(event) => onDakshinaChange(event.target.value)}
              className="h-11 rounded-lg border-[#e2e8f0]"
            />
          </label>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe4ec] bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] lg:hidden">
        <div className="flex h-5 items-center justify-center gap-1 bg-[#22ad64] text-[10px] font-bold text-white">
          <Lock className="h-3 w-3" />
          100% Secure Payment
        </div>
        <div className="grid grid-cols-[130px_1fr] items-center gap-3 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold text-[#7d86a0]">Total Dakshina</p>
            <p className="text-[16px] font-extrabold text-[#061b4d]">
              {"\u20B9"}{formatAmount(totalAmount)}/-
            </p>
          </div>
          <Button
            type="button"
            onClick={onContinue}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end text-[14px] font-extrabold text-white shadow-none hover:opacity-95"
          >
            {text.continueToBooking}
          </Button>
        </div>
      </div>
    </section>
  );
}
