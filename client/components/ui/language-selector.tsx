"use client"

import { ArrowDown, ArrowUp, Check, ChevronDown, Languages } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { cn } from "@/lib/utils"
import { languages, type Language } from "@/translations/translations"

const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  ml: "Malayalam",
  mr: "Marathi",
  ta: "Tamil",
}

const languageCodes: Record<Language, string> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TAM",
}

const textSizeOptions = ["compact", "comfortable", "large"] as const
type TextSizeOption = (typeof textSizeOptions)[number]
const textSizeStorageKey = "yaagam-text-size"

type LanguageSelectorProps = {
  className?: string
  menuClassName?: string
  onSelect?: () => void
}

export function LanguageSelector({ className, menuClassName, onSelect }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [textSize, setTextSize] = useState<TextSizeOption>(() => {
    if (typeof window === "undefined") return "comfortable"

    const storedTextSize = window.localStorage.getItem(textSizeStorageKey)

    return textSizeOptions.includes(storedTextSize as TextSizeOption)
      ? (storedTextSize as TextSizeOption)
      : "comfortable"
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!open) return

    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])


  useEffect(() => {
    document.documentElement.dataset.textSize = textSize
    window.localStorage.setItem(textSizeStorageKey, textSize)
  }, [textSize])

  const updateTextSize = (direction: "decrease" | "increase") => {
    setTextSize((current) => {
      const currentIndex = textSizeOptions.indexOf(current)
      const nextIndex =
        direction === "decrease"
          ? Math.max(0, currentIndex - 1)
          : Math.min(textSizeOptions.length - 1, currentIndex + 1)
      const nextTextSize = textSizeOptions[nextIndex]

      document.documentElement.dataset.textSize = nextTextSize
      window.localStorage.setItem(textSizeStorageKey, nextTextSize)

      return nextTextSize
    })
  }
  const switchLanguage = (newLang: Language) => {
    let newPath = pathname

    const currentPrefix = languages.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)

    if (currentPrefix) {
      if (newLang === "en") {
        newPath = pathname.replace(`/${currentPrefix}`, "")
        if (newPath === "") newPath = "/"
      } else {
        newPath = pathname.replace(`/${currentPrefix}`, `/${newLang}`)
      }
    } else if (newLang !== "en") {
      newPath = `/${newLang}${pathname === "/" ? "" : pathname}`
    }

    setLanguage(newLang)
    setOpen(false)
    onSelect?.()
    router.push(newPath)
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-label={t.nav.selectLanguage}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn("flex min-h-12 min-w-0 items-center gap-2 px-3 py-2 text-left text-base font-bold leading-5 transition-colors hover:text-saffron", className)}
      >
        <Languages className="h-5 w-5 shrink-0" />
        <span className="min-w-0 text-wrap-safe">{languageLabels[language]}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn("absolute right-0 top-[calc(100%+0.5rem)] z-60 w-50 rounded-lg border border-black/10 bg-white p-2 text-text-primary shadow-2xl shadow-black/20", menuClassName)}>
          <p className="px-2 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-wide text-text-primary/45">
            Choose language
          </p>
<div className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-black/4 px-2 py-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-text-primary/45">
              Text size
            </span>
            <div className="flex h-9 items-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => updateTextSize("decrease")}
                disabled={textSize === "compact"}
                aria-label="Decrease text size"
                className="flex h-full w-12 items-center justify-center gap-0.5 text-saffron transition-colors hover:bg-saffron/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-sm font-extrabold leading-none">A</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <span className="h-5 w-px bg-black/10" />
              <button
                type="button"
                onClick={() => updateTextSize("increase")}
                disabled={textSize === "large"}
                aria-label="Increase text size"
                className="flex h-full w-12 items-center justify-center gap-0.5 text-text-primary transition-colors hover:bg-saffron/10 hover:text-saffron disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-lg font-extrabold leading-none">A</span>
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {languages.map((item) => {
              const selected = item === language

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchLanguage(item)}
                  className={cn(
                    "flex min-h-9 w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm font-extrabold leading-5 transition-colors hover:bg-saffron/10 hover:text-saffron",
                    selected && "bg-saffron/15 text-[#6f3a11] hover:bg-saffron/20",
                  )}
                >
                  <span className="min-w-0 flex-1 text-wrap-safe">{languageLabels[item]}</span>
                  <span className="rounded bg-black/7 px-1.5 py-0.5 text-[11px] font-extrabold leading-4 text-text-primary/35">
                    {languageCodes[item]}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-saffron" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}