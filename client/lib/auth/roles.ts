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

export function getRequiredRoles(pathname: string) {
  const route = Object.keys(protectedRouteRoles).find((prefix) =>
    pathname.startsWith(prefix),
  )

  return route ? protectedRouteRoles[route] : null
}
