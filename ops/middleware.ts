import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENTRY_PATH, AUTH_HOME_PATH } from "@/lib/routes";

const publicRoutes = [AUTH_ENTRY_PATH, "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  const hasSession = request.cookies.has("ops_session");

  if (!hasSession && !isPublicRoute) {
    return NextResponse.rewrite(new URL("/", request.url));
  }

  if (hasSession && pathname === AUTH_ENTRY_PATH) {
    return NextResponse.redirect(new URL(AUTH_HOME_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};