"use client"

import { useEffect } from "react"

import styles from "./app-toast.module.css"

export type AppToastData = {
  id: number
  message: string
  type: "success" | "error"
}

type AppToastProps = {
  toast: AppToastData | null
  onDismiss: () => void
}

export function AppToast({ toast, onDismiss }: AppToastProps) {
  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timeout)
  }, [onDismiss, toast])

  if (!toast) return null

  const isSuccess = toast.type === "success"

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6">
      <div
        key={toast.id}
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
        className={`${styles.toast} flex min-h-16 max-w-[calc(100vw-2rem)] items-center gap-4 rounded-full border px-4 py-3 pr-6 shadow-xl backdrop-blur-sm ${
          isSuccess
            ? "border-orange-200 bg-[#fff0e3]/95 text-text-primary shadow-orange-900/15"
            : "border-red-200 bg-[#fff0ee]/95 text-[#7f1d1d] shadow-red-900/15"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
            isSuccess ? `${styles.icon} bg-saffron` : `${styles.errorIcon} bg-red-500`
          }`}
          aria-hidden="true"
        >
          {isSuccess ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                className={styles.check}
                d="m5 12.5 4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                className={styles.errorLine}
                d="M7 7l10 10"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                className={styles.errorLine}
                d="M17 7 7 17"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>

        <span className="text-sm font-bold sm:text-base">{toast.message}</span>
      </div>
    </div>
  )
}
