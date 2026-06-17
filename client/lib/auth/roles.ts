export const userRoles = ["user", "admin", "super-admin"] as const

export type UserRole = (typeof userRoles)[number]

export const protectedRouteRoles: Record<string, UserRole[]> = {
  "/user": ["user", "admin", "super-admin"],
  "/admin": ["admin", "super-admin"],
  "/superadmin": ["super-admin"],
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole)
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

  return isUserRole(role) ? role : null
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
