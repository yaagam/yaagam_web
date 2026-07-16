import { APP_ROUTES } from "@/constants/route.const"

export const userRoles = ["user", "admin", "super-admin"] as const

export type UserRole = (typeof userRoles)[number]

export const protectedRouteRoles: Record<string, UserRole[]> = {
  [APP_ROUTES.user]: ["user", "admin", "super-admin"],
  [APP_ROUTES.admin]: ["admin", "super-admin"],
  [APP_ROUTES.superAdmin]: ["super-admin"],
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole)
}

function normalizeUserRole(value: unknown): UserRole | null {
  if (isUserRole(value)) return value
  if (typeof value !== "string") return null

  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-")

  if (normalized === "superadmin") return "super-admin"

  return isUserRole(normalized) ? normalized : null
}

export function getUserRoleFromUnknown(data: unknown) {
  if (!data || typeof data !== "object") return null

  const authData = data as {
    role?: unknown
    user?: { role?: unknown }
    account?: { role?: unknown }
    loggedInUser?: { role?: unknown }
  }

  const role =
    authData.role ??
    authData.user?.role ??
    authData.account?.role ??
    authData.loggedInUser?.role

  return normalizeUserRole(role)
}

export function canAccessAdmin(role: UserRole | null) {
  return role === "admin" || role === "super-admin"
}

export function getRequiredRoles(pathname: string) {
  const route = Object.keys(protectedRouteRoles).find((prefix) =>
    pathname.startsWith(prefix),
  )

  return route ? protectedRouteRoles[route] : null
}
