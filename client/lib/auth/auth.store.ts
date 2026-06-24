import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserRole } from "@/lib/auth/roles";

type AuthState = {
  isLoggedIn: boolean;
  role: UserRole | null;
  whatsappNumber: string;
  setSession: (role: UserRole | null, whatsappNumber?: string) => void;
  setWhatsappNumber: (whatsappNumber: string) => void;
  clearSession: () => void;
};

function normalizeWhatsappNumber(whatsappNumber: string) {
  return whatsappNumber.replace(/\D/g, "").slice(0, 10);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      role: null,
      whatsappNumber: "",
      setSession: (role, whatsappNumber) =>
        set({
          isLoggedIn: Boolean(role),
          role,
          whatsappNumber:
            whatsappNumber !== undefined
              ? normalizeWhatsappNumber(whatsappNumber)
              : get().whatsappNumber,
        }),
      setWhatsappNumber: (whatsappNumber) =>
        set({ whatsappNumber: normalizeWhatsappNumber(whatsappNumber) }),
      clearSession: () =>
        set({ isLoggedIn: false, role: null, whatsappNumber: "" }),
    }),
    {
      name: "yaagam-auth-store",
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        role: state.role,
        whatsappNumber: state.whatsappNumber,
      }),
    },
  ),
);