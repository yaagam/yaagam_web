"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isLanguage, type Language } from "@/translations/locales";

type LanguagePreferenceState = {
  selectedLanguage: Language | null;
  hasHydrated: boolean;
  setSelectedLanguage: (language: Language) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useLanguagePreferenceStore = create<LanguagePreferenceState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      hasHydrated: false,
      setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "yaagam-language-preference",
      skipHydration: true,
      partialize: (state) => ({
        selectedLanguage: state.selectedLanguage,
      }),
      merge: (persistedState, currentState) => {
        const storedLanguage = (
          persistedState as { selectedLanguage?: unknown } | undefined
        )?.selectedLanguage;

        return {
          ...currentState,
          selectedLanguage:
            typeof storedLanguage === "string" && isLanguage(storedLanguage)
              ? storedLanguage
              : null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
