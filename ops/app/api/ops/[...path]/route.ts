import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const upstreamBaseUrl = process.env.OPS_API_BASE_URL;
const trustedProxySecret = process.env.TRUSTED_PROXY_SECRET;
const requiresTrustedProxySecret = process.env.NODE_ENV === "production";
const requestHeadersToRemove = new Set(["host", "content-length", "connection"]);
const responseHeadersToRemove = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!upstreamBaseUrl || (requiresTrustedProxySecret && !trustedProxySecret)) {
    return Response.json({ message: "Server proxy is not configured" }, { status: 500 });
  }

  const { path } = await context.params;
  const upstreamUrl = new URL(`${upstreamBaseUrl.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`);
  upstreamUrl.search = request.nextUrl.search;
  const headers = new Headers(request.headers);
  requestHeadersToRemove.forEach((header) => headers.delete(header));
  if (trustedProxySecret) {
    headers.set("x-yaagam-proxy-secret", trustedProxySecret);
  }

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store"
  });

  const responseHeaders = new Headers(response.headers);
  responseHeadersToRemove.forEach((header) => responseHeaders.delete(header));

  // Cookies now belong to the console origin, not the hidden upstream host/path.
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length > 0) {
    responseHeaders.delete("set-cookie");
    setCookies.forEach((cookie) => {
      const sameOriginCookie = cookie
        .replace(/;\s*Domain=[^;]+/gi, "")
        .replace(/;\s*Path=[^;]+/gi, "; Path=/");
      responseHeaders.append("set-cookie", sameOriginCookie);
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
export const HEAD = forward;
