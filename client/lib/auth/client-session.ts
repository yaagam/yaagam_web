import { isUserRole, type UserRole } from "@/lib/auth/roles"

const AUTH_SESSION_KEY = "yaagam-authenticated"
const AUTH_ROLE_KEY = "yaagam-auth-role"

export const AUTH_SESSION_CHANGED_EVENT = "yaagam-auth-session-changed"

export function isClientLoggedIn() {
  if (typeof window === "undefined") return false

  return window.localStorage.getItem(AUTH_SESSION_KEY) === "true"
}

export function getClientUserRole() {
  if (typeof window === "undefined") return null

  const role = window.localStorage.getItem(AUTH_ROLE_KEY)

  return isUserRole(role) ? role : null
}

export function markClientLoggedIn(role?: UserRole | null) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(AUTH_SESSION_KEY, "true")
  if (role) {
    window.localStorage.setItem(AUTH_ROLE_KEY, role)
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function clearClientLoginState() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.localStorage.removeItem(AUTH_ROLE_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}
