import { ToastProvider } from "@/components/ui/toast-provider";
import { QueryProvider } from "@/providers/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider><ToastProvider>{children}</ToastProvider></QueryProvider>;
}