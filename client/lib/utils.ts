import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (typeof error === "string" && error.trim()) return error

  if (Array.isArray(error)) {
    const messages = error
      .map((item) => getErrorMessage(item, ""))
      .filter(Boolean)

    if (messages.length > 0) return messages.join(", ")
  }

  if (error instanceof Error && error.message) return error.message

  if (error && typeof error === "object" && "message" in error) {
    return getErrorMessage(error.message, fallback)
  }

  return fallback
}



export function normalizeAmount(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const num = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : fallback;
  }
  if (typeof value === "object") {
    const amount = value as {
      value?: unknown;
      $numberDecimal?: unknown;
      d?: unknown;
      e?: unknown;
      s?: unknown;
    };
    const scalarValue = amount.value ?? amount.$numberDecimal;

    if (scalarValue !== undefined) return normalizeAmount(scalarValue, fallback);

    if (
      Array.isArray(amount.d) &&
      amount.d.length > 0 &&
      amount.d.every((part) => Number.isInteger(part) && Number(part) >= 0) &&
      Number.isInteger(amount.e) &&
      (amount.s === 1 || amount.s === -1)
    ) {
      const digits = amount.d
        .map((part, index) =>
          index === 0 ? String(part) : String(part).padStart(7, "0"),
        )
        .join("");
      const decimalPosition = Number(amount.e) + 1;
      const unsigned =
        decimalPosition <= 0
          ? `0.${"0".repeat(-decimalPosition)}${digits}`
          : decimalPosition >= digits.length
            ? `${digits}${"0".repeat(decimalPosition - digits.length)}`
            : `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
      const parsed = Number(`${amount.s === -1 ? "-" : ""}${unsigned}`);

      return Number.isFinite(parsed) ? parsed : fallback;
    }
  }
  return fallback;
}
