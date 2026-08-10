const DEFAULT_COUNTRY_CALLING_CODE = "91";
const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

export function normalizeWhatsappNumber(value: string) {
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (!digits) return "";

  const internationalDigits =
    trimmedValue.startsWith("+") || digits.length !== 10
      ? digits
      : `${DEFAULT_COUNTRY_CALLING_CODE}${digits}`;

  return `+${internationalDigits.slice(0, MAX_E164_DIGITS)}`;
}

export function isValidWhatsappNumber(value: string) {
  const digitCount = normalizeWhatsappNumber(value).replace(/\D/g, "").length;
  return digitCount >= MIN_E164_DIGITS && digitCount <= MAX_E164_DIGITS;
}

export function formatWhatsappNumber(value: string) {
  return normalizeWhatsappNumber(value);
}