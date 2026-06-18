import { isUserRole, type UserRole } from "@/lib/auth/roles"

const AUTH_SESSION_KEY = "yaagam-authenticated"
const AUTH_ROLE_KEY = "yaagam-auth-role"
const AUTH_REFRESHED_AT_KEY = "yaagam-auth-refreshed-at"

export const AUTH_SESSION_CHANGED_EVENT = "yaagam-auth-session-changed"

export function isClientLoggedIn() {
  if (typeof window === "undefined") return false

  return (
    window.localStorage.getItem(AUTH_SESSION_KEY) === "true" &&
    Boolean(getClientUserRole())
  )
}

export function getClientUserRole() {
  if (typeof window === "undefined") return null

  const role = window.localStorage.getItem(AUTH_ROLE_KEY)

  return isUserRole(role) ? role : null
}

export function markClientLoggedIn(role?: UserRole | null) {
  if (typeof window === "undefined") return

  if (!role) {
    clearClientLoginState()
    return
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, "true")
  window.localStorage.setItem(AUTH_ROLE_KEY, role)
  markClientRefreshSucceeded()
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function clearClientLoginState() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.localStorage.removeItem(AUTH_ROLE_KEY)
  window.localStorage.removeItem(AUTH_REFRESHED_AT_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function markClientRefreshSucceeded() {
  if (typeof window === "undefined") return

  window.localStorage.setItem(AUTH_REFRESHED_AT_KEY, String(Date.now()))
}

export function wasClientRefreshRecentlySucceeded(graceMs = 5000) {
  if (typeof window === "undefined") return false

  const refreshedAt = Number(window.localStorage.getItem(AUTH_REFRESHED_AT_KEY))

  return Number.isFinite(refreshedAt) && Date.now() - refreshedAt < graceMs
}
