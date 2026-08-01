import { cache } from "react";

/**
 * Wraps an API function in React's `cache()` to deduplicate requests during Server Component rendering.
 * It safely bypasses the cache if executed on the client side to avoid Next.js App Router Client Component errors.
 */
export function serverCache<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
): T {
  if (typeof window === "undefined") {
    return cache(apiFunction) as T;
  }
  return apiFunction;
}
