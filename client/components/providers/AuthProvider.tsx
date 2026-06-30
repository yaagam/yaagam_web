"use client";

import { useEffect } from "react";

import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import {
  getClientUserRole,
  hasVisibleRefreshTokenCookie,
  isClientLoggedIn,
} from "@/lib/auth/client-session";
import { useAuthStore } from "@/lib/auth/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let isActive = true;
    const authStore = useAuthStore.getState();
    const storedRole = getClientUserRole();
    const hasStoredSession = isClientLoggedIn();

    if (hasStoredSession && storedRole) {
      authStore.setSession(
        storedRole,
        authStore.whatsappNumber,
        authStore.user,
      );
    }

    async function initializeAuth() {
      useAuthStore.getState().setChecking();

      try {
        await refreshAuthSession();
      } catch {
        if (isActive) useAuthStore.getState().clearSession();
      }
    }

    if (
      hasVisibleRefreshTokenCookie() ||
      hasStoredSession ||
      authStore.status === "unknown"
    ) {
      void initializeAuth();
    } else {
      authStore.clearSession();
    }

    return () => {
      isActive = false;
    };
  }, []);

  return children;
}
