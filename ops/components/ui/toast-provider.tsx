"use client";

import { CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string };
type ToastContextValue = { success: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const value = useMemo(() => ({ success }), [success]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} role="status" className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-950 shadow-lg">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="rounded p-1 text-emerald-800 hover:bg-emerald-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}