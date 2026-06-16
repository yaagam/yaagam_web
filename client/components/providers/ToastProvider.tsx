"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { AppToast, type AppToastData } from "@/components/ui/app-toast"

type ToastType = AppToastData["type"]

type ToastContextValue = {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<AppToastData | null>(null)

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ id: Date.now(), type, message })
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AppToast toast={toast} onDismiss={() => setToast(null)} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) throw new Error("useToast must be used within ToastProvider")

  return context
}
