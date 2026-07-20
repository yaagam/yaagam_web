import type { LoginResponse, OpsOperator } from "@/types/auth";

const accessTokenKey = "yaagam.ops.accessToken";
const refreshTokenKey = "yaagam.ops.refreshToken";
const operatorKey = "yaagam.ops.operator";

function secureCookieSuffix() {
  return window.location.protocol === "https:" ? "; secure" : "";
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(refreshTokenKey);
}

export function getOperator(): OpsOperator | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(operatorKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as OpsOperator;
  } catch {
    return null;
  }
}

export function persistSession(session: LoginResponse) {
  window.localStorage.setItem(accessTokenKey, session.accessToken);
  window.localStorage.setItem(refreshTokenKey, session.refreshToken);
  window.localStorage.setItem(operatorKey, JSON.stringify(session.operator));
  document.cookie = `ops_session=1; path=/; max-age=604800; SameSite=Lax${secureCookieSuffix()}`;
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(accessTokenKey);
    window.localStorage.removeItem(refreshTokenKey);
    window.localStorage.removeItem(operatorKey);
    document.cookie = `ops_session=; path=/; max-age=0; SameSite=Lax${secureCookieSuffix()}`;
  }
}