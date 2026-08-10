"use client";

import { useState, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { name: "India", code: "91", placeholder: "98765 43210" },
  { name: "US / Canada", code: "1", placeholder: "202 555 0123" },
  { name: "United Kingdom", code: "44", placeholder: "7700 900123" },
  { name: "UAE", code: "971", placeholder: "50 123 4567" },
  { name: "Australia", code: "61", placeholder: "412 345 678" },
  { name: "Singapore", code: "65", placeholder: "8123 4567" },
  { name: "Saudi Arabia", code: "966", placeholder: "50 123 4567" },
] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
};

function initialCode(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!value.trim().startsWith("+") || !digits) return COUNTRY_CODES[0].code;

  return (
    [...COUNTRY_CODES]
      .sort((a, b) => b.code.length - a.code.length)
      .find((country) => digits.startsWith(country.code))?.code ??
    COUNTRY_CODES[0].code
  );
}

export function WhatsappPhoneInput({
  value,
  onChange,
  inputRef,
  id,
  name,
  disabled,
  readOnly,
  required,
  invalid,
  describedBy,
  onBlur,
  className,
  inputClassName,
  ariaLabel = "WhatsApp number",
}: Props) {
  const [selectedCode, setSelectedCode] = useState(() => initialCode(value));
  const country =
    COUNTRY_CODES.find((item) => item.code === selectedCode) ?? COUNTRY_CODES[0];
  const digits = value.replace(/\D/g, "");
  const nationalNumber =
    value.trim().startsWith("+") && digits.startsWith(country.code)
      ? digits.slice(country.code.length)
      : digits;

  function selectCountry(code: string) {
    const selectedCountry = COUNTRY_CODES.find((item) => item.code === code);
    if (!selectedCountry) return;
    setSelectedCode(selectedCountry.code);
    onChange(`+${selectedCountry.code}${nationalNumber}`);
  }

  function changeNumber(nextValue: string) {
    const nextDigits = nextValue
      .replace(/\D/g, "")
      .slice(0, 15 - country.code.length);
    onChange(`+${country.code}${nextDigits}`);
  }

  return (
    <div className={cn("flex min-w-0 rounded-xl shadow-sm", className)}>
      <select
        value={selectedCode}
        onChange={(event) => selectCountry(event.target.value)}
        disabled={disabled || readOnly}
        aria-label="Country calling code"
        className="h-12 w-auto min-w-0 shrink-0 [field-sizing:content] rounded-l-xl border border-r-0 border-black/15 bg-app-bg px-2 text-sm font-semibold text-text-primary outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {COUNTRY_CODES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name} (+{item.code})
          </option>
        ))}
      </select>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={nationalNumber}
        onChange={(event) => changeNumber(event.target.value)}
        onBlur={onBlur}
        placeholder={country.placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn("min-w-0 rounded-l-none", inputClassName)}
      />
    </div>
  );
}
