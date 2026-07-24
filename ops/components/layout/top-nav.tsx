"use client";

import { Bell, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOpsLogout } from "@/hooks/use-ops-logout";
import { getOperator } from "@/lib/auth-storage";

export function TopNav() {
  const operator = getOperator();
  const logout = useOpsLogout();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Operator</p>
        <h1 className="text-lg font-semibold">{operator?.name ?? "Operations"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label="Profile"><UserCircle className="h-5 w-5" /></Button>
        <Button variant="outline" onClick={() => setConfirmLogout(true)}><LogOut className="h-4 w-4" />Logout</Button>
      </div>
      <ConfirmDialog open={confirmLogout} title="Log out?" description="This will end your operator session on this device." confirmLabel="Logout" destructive onCancel={() => setConfirmLogout(false)} onConfirm={logout} />
    </header>
  );
}