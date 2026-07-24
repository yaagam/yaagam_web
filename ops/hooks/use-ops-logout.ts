"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth-storage";
import { AUTH_ENTRY_PATH } from "@/lib/routes";
import { logoutOps } from "@/services/auth.service";

export function useOpsLogout() {
  const router = useRouter();

  return async function logout() {
    try {
      await logoutOps();
    } catch {
      // Local cleanup should still happen if the server session already expired.
    } finally {
      clearSession();
      router.replace(AUTH_ENTRY_PATH);
      router.refresh();
    }
  };
}