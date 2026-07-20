"use client";

import { Bell, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearSession, getOperator } from "@/lib/auth-storage";
import { AUTH_ENTRY_PATH } from "@/lib/routes";

export function TopNav() {
  const router = useRouter();
  const operator = getOperator();

  function logout() {
    clearSession();
    router.replace(AUTH_ENTRY_PATH);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Operator</p>
        <h1 className="text-lg font-semibold">{operator?.name ?? "Operations"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Profile">
          <UserCircle className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}