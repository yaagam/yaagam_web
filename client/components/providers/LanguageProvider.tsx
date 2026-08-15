"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { isLanguage, type Language } from "@/translations/locales"
import { translations } from "@/translations/translations"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (typeof translations)[Language]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode
  initialLanguage?: Language
}) {
  const resolvedLanguage =
    initialLanguage && isLanguage(initialLanguage) ? initialLanguage : "en"
  const [language, setCurrentLanguage] = useState<Language>(resolvedLanguage)


  const setLanguage = useCallback((nextLanguage: Language) => {
    setCurrentLanguage(nextLanguage)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, t: translations[language] }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within LanguageProvider")
  return context
}