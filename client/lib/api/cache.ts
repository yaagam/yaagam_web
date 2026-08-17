import { cache } from "react";
import apiClient from "@/lib/api/axios/axios.instance";

type PublicApiParam = string | number | boolean | null | undefined;
type PublicApiCacheOptions = { revalidate?: number; tags?: string[] };

export const PUBLIC_API_REVALIDATE_SECONDS = 300;

/** Shared caching is safe only for public, non-user-specific endpoints. */
export async function publicApiGet<T>(
  path: string,
  params: Record<string, PublicApiParam> = {},
  options: PublicApiCacheOptions = {},
): Promise<T> {
  if (typeof window !== "undefined") {
    const response = await apiClient.get<T>(path, { params });
    return response.data;
  }
  const apiUrl = process.env.API_URL?.trim();
  if (!apiUrl) throw new Error("API_URL is not configured.");
  const url = new URL(
    path.replace(/^\/+/, ""),
    apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`,
  );
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(name, String(value));
    }
  }
  const headers = new Headers({ accept: "application/json" });
  const proxySecret = process.env.TRUSTED_PROXY_SECRET?.trim();
  if (proxySecret) headers.set("x-yaagam-proxy-secret", proxySecret);
  const response = await fetch(url, {
    headers,
    cache: "force-cache",
    next: {
      revalidate: options.revalidate ?? PUBLIC_API_REVALIDATE_SECONDS,
      tags: options.tags,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Public API request failed (${response.status}) for ${url.pathname}.`,
    );
  }
  return (await response.json()) as T;
}

/**
 * Wraps an API function in React's `cache()` to deduplicate requests during Server Component rendering.
 * It safely bypasses the cache if executed on the client side to avoid Next.js App Router Client Component errors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serverCache<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
): T {
  if (typeof window === "undefined") {
    return cache(apiFunction) as T;
  }
  return apiFunction;
}
