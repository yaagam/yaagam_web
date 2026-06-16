const AUTH_SESSION_KEY = "yaagam-authenticated"

export const AUTH_SESSION_CHANGED_EVENT = "yaagam-auth-session-changed"

export function isClientLoggedIn() {
  if (typeof window === "undefined") return false

  return window.localStorage.getItem(AUTH_SESSION_KEY) === "true"
}

export function markClientLoggedIn() {
  if (typeof window === "undefined") return

  window.localStorage.setItem(AUTH_SESSION_KEY, "true")
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function clearClientLoginState() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}
