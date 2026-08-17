"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSessionMarker, persistSession } from "@/lib/auth-storage";
import { AUTH_HOME_PATH } from "@/lib/routes";
import { loginOps, refreshOps } from "@/services/auth.service";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login-schema";

function getPostLoginPath() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : AUTH_HOME_PATH;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      totp: "",
      rememberDevice: false
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!hasSessionMarker()) return;

      try {
        const session = await refreshOps();
        if (cancelled) return;
        persistSession(session);
        router.replace(getPostLoginPath());
        router.refresh();
      } catch {
        // Stay on the login page when no backend session exists.
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(values: LoginFormValues) {
    setError("");
    try {
      const session = await loginOps(values);
      persistSession(session, values.rememberDevice);
      router.replace(getPostLoginPath());
      router.refresh();
    } catch {
      setError("Unable to sign in. Check the credentials and TOTP code.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="username" autoComplete="username" className="pl-9" {...register("username")} />
        </div>
        {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pl-9 pr-10"
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition hover:text-foreground focus:outline-none"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="totp">TOTP</Label>
        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="pl-9 tracking-[0.28em]" {...register("totp")} />
        </div>
        {errors.totp && <p className="text-sm text-destructive">{errors.totp.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" {...register("rememberDevice")} />
        Remember Device
      </label>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
