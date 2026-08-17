import axios from "axios";

export class OtpApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
    readonly expiresInSeconds?: number,
  ) {
    super(message);
    this.name = "OtpApiError";
  }
}

export function createOtpApiError(error: unknown, fallback: string): OtpApiError {
  if (!axios.isAxiosError(error)) {
    return new OtpApiError(error instanceof Error ? error.message : fallback);
  }

  const body = error.response?.data;
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const nested = payload.message && typeof payload.message === "object"
    ? payload.message as Record<string, unknown>
    : payload;
  const message = typeof nested.message === "string"
    ? nested.message
    : typeof payload.message === "string" ? payload.message : fallback;
  const code = typeof nested.code === "string" ? nested.code : undefined;
  const retryAfterSeconds = typeof nested.retryAfterSeconds === "number"
    ? Math.max(0, Math.ceil(nested.retryAfterSeconds))
    : undefined;

  const expiresInSeconds = typeof nested.expiresInSeconds === "number"
    ? Math.max(0, Math.ceil(nested.expiresInSeconds))
    : undefined;

  return new OtpApiError(message, code, retryAfterSeconds, expiresInSeconds);
}
