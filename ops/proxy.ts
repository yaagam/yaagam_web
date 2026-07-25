import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENTRY_PATH, AUTH_HOME_PATH } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("ops_session");

  if (pathname === AUTH_ENTRY_PATH) {
    return hasSession
      ? NextResponse.redirect(new URL(AUTH_HOME_PATH, request.url))
      : NextResponse.next();
  }

  if (!hasSession) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(AUTH_HOME_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
