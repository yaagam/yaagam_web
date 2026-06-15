"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { languages, translations, type Language } from "@/lib/i18n/translations"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (typeof translations)[Language]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("yaagam-language")
    if (!languages.includes(savedLanguage as Language)) return

    const timeout = window.setTimeout(() => setLanguage(savedLanguage as Language), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    window.localStorage.setItem("yaagam-language", language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, t: translations[language] }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within LanguageProvider")
  return context
}
