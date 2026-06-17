"use client";

import Link from "next/link";
import { Calendar, ChevronDown, Flower, LayoutDashboard, ListChecks, LogOut, Menu, Phone, UserCircle, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { LanguageSelector } from "@/components/ui/language-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearClientLoginState,
  getClientUserRole,
  isClientLoggedIn,
} from "@/lib/auth/client-session";
import { logoutApi } from "@/lib/api/user/logout.api";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/translations";
import { canAccessAdmin, type UserRole } from "@/lib/auth/roles";

const accountLabels: Record<
  Language,
  { myAccount: string; myPoojas: string; changeNumber: string, logout: string }
> = {
  en: {
    myAccount: "My Account",
    myPoojas: "My Poojas",
    changeNumber: "Change WhatsApp Number",
    logout: "logout"
  },
  ml: {
    myAccount: "എന്റെ അക്കൗണ്ട്",
    myPoojas: "എന്റെ പൂജകൾ",
    changeNumber: "വാട്സ്ആപ്പ് നമ്പർ മാറ്റുക",
    logout: "ലോഗ് ഔട്ട്",
  },
  hi: {
    myAccount: "मेरा अकाउंट",
    myPoojas: "मेरी पूजाएं",
    changeNumber: "WhatsApp नंबर बदलें",
    logout: "लॉग आउट",
  },
};

const LOGOUT_CONFIRM_TITLE = "Are you sure?";
const LOGOUT_CONFIRM_DESCRIPTION = "You will be logged out from this device.";
const LOGOUT_CANCEL_LABEL = "Cancel";
const LOGOUT_CONFIRM_LABEL = "Yes, logout";
const LOGOUT_LOADING_LABEL = "Logging out...";
const LOGOUT_SUCCESS_MESSAGE = "Successfully logged out";
const LOGOUT_ERROR_MESSAGE = "Logout failed. Please try again.";

type AccountMenuProps = {
  className?: string;
  menuClassName?: string;
  onAction?: () => void;
  onLogoutRequest: () => void;
  role: UserRole | null;
  textClassName?: string;
};

function AccountMenu({
  className,
  menuClassName,
  onAction,
  onLogoutRequest,
  role,
  textClassName,
}: AccountMenuProps) {
  const { language } = useLanguage();
  const labels = accountLabels[language];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    onAction?.();
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-12 min-w-0 items-center gap-2 rounded-full px-3 py-2 text-left text-base font-bold leading-5 transition-colors hover:text-saffron",
          textClassName,
        )}
      >
        <UserCircle className="h-5 w-5 shrink-0" />
        <span className="min-w-0 text-wrap-safe">{labels.myAccount}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-60 min-w-56 rounded-xl border border-black/10 bg-white p-1.5 text-text-primary shadow-xl",
            menuClassName,
          )}
        >
          <Link
            href="/user/my-poojas"
            onClick={closeMenu}
            className="flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 text-left font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
          >
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
            <span className="min-w-0 text-wrap-safe">{labels.myPoojas}</span>
          </Link>

          {canAccessAdmin(role) && (
            <Link
              href="/admin"
              onClick={closeMenu}
              className="flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 text-left font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
            >
              <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
              <span className="min-w-0 text-wrap-safe">Admin Panel</span>
            </Link>
          )}

          <WhatsAppLoginModal
            triggerContent={
              <>
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                <span className="min-w-0 text-wrap-safe">{labels.changeNumber}</span>
              </>
            }
            triggerClassName="flex min-h-11 h-auto w-full items-start justify-start gap-3 rounded-lg bg-transparent px-3 py-2 text-left text-base font-bold leading-5 text-text-primary shadow-none hover:bg-orange-50 hover:text-saffron md:px-3"
            onTriggerClick={() => setOpen(false)}
          />

          <button
            onClick={() => {
              closeMenu();
              onLogoutRequest();
            }}
            className="flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 text-left font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
          >
            <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span className="min-w-0 text-wrap-safe text-red-500">
              {labels.logout}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled;

  async function confirmLogout() {
    setIsLoggingOut(true);

    try {
      await logoutApi();
      clearClientLoginState();
      setIsLoggedIn(false);
      setUserRole(null);
      setIsLogoutDialogOpen(false);
      showToast("success", LOGOUT_SUCCESS_MESSAGE);
    } catch {
      showToast("error", LOGOUT_ERROR_MESSAGE);
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleLoginSuccess(role: UserRole | null) {
    setIsLoggedIn(true);
    setUserRole(role);
    setIsAuthChecked(true);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const updateNavbar = () => setIsScrolled(window.scrollY > 16);

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    return () => window.removeEventListener("scroll", updateNavbar);
  }, []);

  useEffect(() => {
    function syncAuthState() {
      setIsLoggedIn(isClientLoggedIn());
      setUserRole(getClientUserRole());
      setIsAuthChecked(true);
    }

    syncAuthState();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <>
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <LogOut className="h-7 w-7" />
            </div>
            <DialogTitle>{LOGOUT_CONFIRM_TITLE}</DialogTitle>
            <DialogDescription>{LOGOUT_CONFIRM_DESCRIPTION}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => setIsLogoutDialogOpen(false)}
              className="min-h-11 rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-60"
            >
              {LOGOUT_CANCEL_LABEL}
            </button>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={confirmLogout}
              className="min-h-11 rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? LOGOUT_LOADING_LABEL : LOGOUT_CONFIRM_LABEL}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <header
      className={`top-0 z-50 flex h-20 w-full items-center transition-colors duration-300 ${isHomePage ? "fixed" : "sticky"
        } ${isTransparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-black/10 bg-white/75 shadow-sm shadow-black/5 backdrop-blur-xl"
        }`}
    >
      <div className="container mx-auto flex min-w-0 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href="/"
            aria-label="Yaagam home"
            className="flex h-12 shrink-0 items-center gap-2 text-saffron"
          >
            <Image src="/logo_png.png" width="80" height="80" alt={'yaagam_logo'} />
          </Link>

          <nav
            aria-label={t.nav.mainNavigation}
            className={`hidden items-center gap-1 text-base font-bold transition-colors duration-300 md:flex md:gap-2 ${isTransparent ? "text-white" : "text-text-primary"
              }`}
          >
            <Link
              href="#poojas"
              className="flex min-h-12 items-center gap-2 px-2 py-2 transition-colors hover:text-saffron md:px-3"
            >
              <span className="hidden sm:inline-flex">
                <Flower />
              </span>
              <span className="text-wrap-safe">{t.nav.poojas}</span>
            </Link>
            <Link
              href="#panchang"
              className="hidden min-h-12 items-center gap-2 px-3 py-2 transition-colors hover:text-saffron lg:flex"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-wrap-safe">{t.nav.panchang}</span>
            </Link>
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
          <LanguageSelector className={isTransparent ? "text-white" : "text-text-primary"} />

          {!isAuthChecked ? (
            <div className="h-12 w-32" aria-hidden="true" />
          ) : isLoggedIn ? (
            <AccountMenu
              onLogoutRequest={() => setIsLogoutDialogOpen(true)}
              role={userRole}
              textClassName={isTransparent ? "text-white" : "text-text-primary"}
            />
          ) : (
            <WhatsAppLoginModal onLoginSuccess={handleLoginSuccess} />
          )}
        </div>

        <div ref={mobileMenuRef} className="relative md:hidden">
          <button
            type="button"
            aria-label={isMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isTransparent && !isMenuOpen
                ? "border-saffron bg-black/10 text-white hover:bg-white/15"
                : "border-black/10 bg-white text-saffron shadow-sm hover:text-saffron hover:border-saffron"
              }`}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div
            id="mobile-navigation"
            aria-hidden={!isMenuOpen}
            className={`absolute right-0 top-[calc(100%+0.75rem)] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-3 text-text-primary shadow-2xl shadow-black/20 transition-all duration-200 ${isMenuOpen
                ? "visible translate-y-0 scale-100 opacity-100"
                : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0"
              }`}
          >
            <nav aria-label={t.nav.mobileNavigation} className="space-y-1">
              <Link
                href="#poojas"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-12 items-start gap-3 rounded-xl px-4 py-3 text-base font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
              >
                <Flower className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 text-wrap-safe">{t.nav.poojas}</span>
              </Link>
              <Link
                href="#panchang"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-12 items-start gap-3 rounded-xl px-4 py-3 text-base font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
              >
                <Calendar className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 text-wrap-safe">{t.nav.panchang}</span>
              </Link>
              <LanguageSelector
                className="w-full justify-start rounded-xl px-4 hover:bg-orange-50"
                menuClassName="left-0 right-auto top-[calc(100%+0.25rem)] w-full"
                onSelect={() => setIsMenuOpen(false)}
              />
            </nav>

            {isLoggedIn && (
              <div className="mt-3 border-t border-black/10 pt-3">
                <AccountMenu
                  className="w-full"
                  textClassName="w-full justify-start rounded-xl px-4 text-text-primary hover:bg-orange-50"
                  menuClassName="left-0 right-auto top-[calc(100%+0.25rem)] w-full"
                  onAction={() => setIsMenuOpen(false)}
                  onLogoutRequest={() => setIsLogoutDialogOpen(true)}
                  role={userRole}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      </header>
    </>
  );
}
