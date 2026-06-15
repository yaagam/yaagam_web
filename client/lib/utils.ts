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
