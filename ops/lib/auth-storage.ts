import type { OpsAuthResponse, OpsOperator } from "@/types/auth";

const operatorKey = "yaagam.ops.operator";

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

export function persistSession(session: OpsAuthResponse) {
  const operator: OpsOperator = {
    id: session.operatorId,
    name: session.username,
    username: session.username,
    role: session.role
  };

  window.localStorage.setItem(operatorKey, JSON.stringify(operator));
  document.cookie = `ops_session=1; path=/; max-age=604800; SameSite=Lax${secureCookieSuffix()}`;
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(operatorKey);
    document.cookie = `ops_session=; path=/; max-age=0; SameSite=Lax${secureCookieSuffix()}`;
  }
}