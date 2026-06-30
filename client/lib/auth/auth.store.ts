import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserRole } from "@/lib/auth/roles";

export type AuthStatus =
  "unknown" | "checking" | "authenticated" | "unauthenticated";

export type AuthUserProfile = {
  id: string;
  role: UserRole;
  whatsappNumber?: string;
};

type AuthState = {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  role: UserRole | null;
  user: AuthUserProfile | null;
  whatsappNumber: string;
  setChecking: () => void;
  setSession: (
    role: UserRole | null,
    whatsappNumber?: string,
    user?: Partial<AuthUserProfile> | null,
  ) => void;
  setWhatsappNumber: (whatsappNumber: string) => void;
  clearSession: () => void;
};

function normalizeWhatsappNumber(whatsappNumber: string) {
  return whatsappNumber.replace(/\D/g, "").slice(0, 10);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: "unknown",
      isAuthenticated: false,
      isLoggedIn: false,
      role: null,
      user: null,
      whatsappNumber: "",
      setChecking: () =>
        set((state) => ({
          status:
            state.status === "authenticated" ? "authenticated" : "checking",
        })),
      setSession: (role, whatsappNumber, user) => {
        if (!role) {
          get().clearSession();
          return;
        }

        const currentUser = get().user;
        const nextWhatsappNumber =
          whatsappNumber !== undefined
            ? normalizeWhatsappNumber(whatsappNumber)
            : get().whatsappNumber;
        const nextUser: AuthUserProfile | null = user?.id
          ? {
              id: user.id,
              role,
              whatsappNumber: nextWhatsappNumber || user.whatsappNumber,
            }
          : currentUser
            ? {
                ...currentUser,
                role,
                whatsappNumber:
                  nextWhatsappNumber || currentUser.whatsappNumber,
              }
            : null;

        set({
          status: "authenticated",
          isAuthenticated: true,
          isLoggedIn: true,
          role,
          user: nextUser,
          whatsappNumber: nextWhatsappNumber,
        });
      },
      setWhatsappNumber: (whatsappNumber) => {
        const normalizedWhatsappNumber =
          normalizeWhatsappNumber(whatsappNumber);

        set((state) => ({
          whatsappNumber: normalizedWhatsappNumber,
          user: state.user
            ? { ...state.user, whatsappNumber: normalizedWhatsappNumber }
            : state.user,
        }));
      },
      clearSession: () =>
        set({
          status: "unauthenticated",
          isAuthenticated: false,
          isLoggedIn: false,
          role: null,
          user: null,
          whatsappNumber: "",
        }),
    }),
    {
      name: "yaagam-auth-store",
      partialize: (state) => ({
        status: state.status,
        isAuthenticated: state.isAuthenticated,
        isLoggedIn: state.isLoggedIn,
        role: state.role,
        user: state.user,
        whatsappNumber: state.whatsappNumber,
      }),
    },
  ),
);
