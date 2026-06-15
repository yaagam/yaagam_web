"use client"

import { Check, ChevronDown, Languages } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { cn } from "@/lib/utils"
import { languageNames, languages } from "@/lib/i18n/translations"

type LanguageSelectorProps = {
  className?: string
  menuClassName?: string
  onSelect?: () => void
}

export function LanguageSelector({ className, menuClassName, onSelect }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t.nav.selectLanguage}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn("flex h-12 items-center gap-2 px-3 text-base font-bold transition-colors hover:text-saffron", className)}
      >
        <Languages className="h-5 w-5 shrink-0" />
        <span>{languageNames[language]}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn("absolute right-0 top-[calc(100%+0.5rem)] z-60 min-w-44 rounded-xl border border-black/10 bg-white p-1.5 text-text-primary shadow-xl", menuClassName)}>
          {languages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setLanguage(item)
                setOpen(false)
                onSelect?.()
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg px-3 text-left font-bold transition-colors hover:bg-orange-50 hover:text-saffron"
            >
              {languageNames[item]}
              {item === language && <Check className="h-4 w-4 text-saffron" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
