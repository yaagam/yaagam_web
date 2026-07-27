import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "content-encoding",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function getBackendUrl(request: NextRequest, path: string[]) {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    throw new Error("API_URL is not configured.");
  }

  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  const targetUrl = new URL(path.map(encodeURIComponent).join("/"), baseUrl);
  targetUrl.search = request.nextUrl.search;

  return targetUrl;
}

function getForwardHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  });

  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/).map((cookie) => cookie.trim());
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & {
    getSetCookie?: () => string[];
  }).getSetCookie;

  if (getSetCookie) return getSetCookie.call(headers);

  const header = headers.get("set-cookie");
  return header ? splitSetCookieHeader(header) : [];
}

function makeCookieFirstParty(cookie: string) {
  return cookie
    .replace(/;\s*Domain=[^;]+/gi, "")
    .replace(/;\s*Path=[^;]*/i, "; Path=/");
}

function getResponseHeaders(headers: Headers) {
  const responseHeaders = new Headers();

  headers.forEach((value, name) => {
    const normalizedName = name.toLowerCase();
    if (
      normalizedName !== "set-cookie" &&
      !HOP_BY_HOP_HEADERS.has(normalizedName)
    ) {
      responseHeaders.set(name, value);
    }
  });

  for (const cookie of getSetCookieHeaders(headers)) {
    responseHeaders.append("set-cookie", makeCookieFirstParty(cookie));
  }

  return responseHeaders;
}

function hasValidMutationOrigin(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return true;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

async function proxyToBackend(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-origin request rejected." },
      { status: 403 },
    );
  }

  try {
    const { path } = await context.params;
    const targetUrl = getBackendUrl(request, path);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: getForwardHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: getResponseHeaders(backendResponse.headers),
    });
  } catch (error) {
    console.error("[backend-proxy] request failed", error);

    return NextResponse.json(
      { message: "The backend service is unavailable." },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
