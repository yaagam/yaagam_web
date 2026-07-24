import type { OpsAuthResponse, OpsOperator } from "@/types/auth";

const operatorKey = "yaagam.ops.operator";
const sessionCookieName = "ops_session";
const persistentSessionMaxAgeSeconds = 604_800;

function secureCookieSuffix() {
  return window.location.protocol === "https:" ? "; secure" : "";
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

export function persistSession(session: OpsAuthResponse, persistent = true) {
  const operator: OpsOperator = {
    id: session.operatorId,
    name: session.username,
    username: session.username,
    role: session.role
  };

  window.localStorage.setItem(operatorKey, JSON.stringify(operator));
  const maxAge = persistent ? `; max-age=${persistentSessionMaxAgeSeconds}` : "";
  document.cookie = `${sessionCookieName}=1; path=/${maxAge}; SameSite=Lax${secureCookieSuffix()}`;
}

export function hasSessionMarker() {
  if (typeof window === "undefined") return false;
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${sessionCookieName}=`));
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(operatorKey);
    document.cookie = `${sessionCookieName}=; path=/; max-age=0; SameSite=Lax${secureCookieSuffix()}`;
  }
}