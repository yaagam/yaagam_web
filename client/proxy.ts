import { NextRequest, NextResponse } from "next/server"

import { getRequiredRoles, getUserRoleFromUnknown, isUserRole } from "@/lib/auth/roles"

type AccessTokenPayload = {
  role?: unknown
  exp?: unknown
}

const ACCESS_TOKEN_COOKIE =
  process.env.ACCESS_TOKEN_COOKIE?.trim() || "accessToken"
const REFRESH_TOKEN_COOKIE =
  process.env.REFRESH_TOKEN_COOKIE?.trim() || "refreshToken"
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET?.trim()
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim()

function decodeBase64UrlToString(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")

  return atob(padded)
}

function decodeBase64UrlToBytes(value: string) {
  const decoded = decodeBase64UrlToString(value)
  const bytes = new Uint8Array(decoded.length)

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }

  return bytes
}

async function isValidAccessTokenSignature(
  header: string,
  payload: string,
  signature: string,
) {
  if (!JWT_ACCESS_SECRET) return true

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_ACCESS_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  return crypto.subtle.verify(
    "HMAC",
    key,
    decodeBase64UrlToBytes(signature),
    new TextEncoder().encode(`${header}.${payload}`),
  )
}

async function getRoleFromAccessToken(accessToken: string) {
  const [header, payload, signature] = accessToken.split(".")

  if (!header || !payload || !signature) return null

  try {
    const isValidSignature = await isValidAccessTokenSignature(
      header,
      payload,
      signature,
    )

    if (!isValidSignature) return null

    const parsed = JSON.parse(decodeBase64UrlToString(payload)) as AccessTokenPayload

    if (
      typeof parsed.exp === "number" &&
      Math.floor(Date.now() / 1000) >= parsed.exp
    ) {
      return null
    }

    return isUserRole(parsed.role) ? parsed.role : null
  } catch {
    return null
  }
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/).map((cookie) => cookie.trim())
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & {
    getSetCookie?: () => string[]
  }).getSetCookie

  if (getSetCookie) {
    return getSetCookie.call(headers)
  }

  const header = headers.get("set-cookie")

  return header ? splitSetCookieHeader(header) : []
}

async function refreshAccessToken(request: NextRequest) {
  if (!API_URL) return null

  const refreshUrl = new URL("/auth/refresh", API_URL)
  const cookie = request.headers.get("cookie")

  if (!cookie) return null

  try {
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        cookie,
      },
      cache: "no-store",
    })

    if (!response.ok) return null

    const data = await response.json().catch(() => null)
    const role = getUserRoleFromUnknown(data?.data ?? data)

    if (!role) return null

    return {
      role,
      setCookieHeaders: getSetCookieHeaders(response.headers),
    }
  } catch {
    return null
  }
}

function redirectToHome(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url))
}

export async function proxy(request: NextRequest) {
  const requiredRoles = getRequiredRoles(request.nextUrl.pathname)

  if (!requiredRoles) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  let role = accessToken ? await getRoleFromAccessToken(accessToken) : null

  if (!role) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value

    if (!refreshToken) {
      return redirectToHome(request)
    }

    const refreshed = await refreshAccessToken(request)

    if (!refreshed) {
      return redirectToHome(request)
    }

    role = refreshed.role

    if (!requiredRoles.includes(role)) {
      return redirectToHome(request)
    }

    const response = NextResponse.next()

    for (const setCookie of refreshed.setCookieHeaders) {
      response.headers.append("set-cookie", setCookie)
    }

    return response
  }

  if (!requiredRoles.includes(role)) {
    return redirectToHome(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/superadmin/:path*"],
}
