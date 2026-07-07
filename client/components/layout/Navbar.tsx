"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import {
  ChevronDown,
  Flower,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Phone,
  Sparkles,
  UserCircle,
} from "lucide-react";
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
import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { useAuthStore } from "@/lib/auth/auth.store";
import { logoutApi } from "@/lib/api/user/logout.api";
import { cn } from "@/lib/utils";
import { canAccessAdmin, type UserRole } from "@/lib/auth/roles";
import {
  LOGOUT_CANCEL_LABEL,
  LOGOUT_CONFIRM_DESCRIPTION,
  LOGOUT_CONFIRM_LABEL,
  LOGOUT_CONFIRM_TITLE,
  LOGOUT_ERROR_MESSAGE,
  LOGOUT_LOADING_LABEL,
  LOGOUT_SUCCESS_MESSAGE,
} from "@/constants/navbar.const";
import { accountLabels } from "@/translations/navbar-copy";
import { APP_ROUTES, SECTION_ROUTES } from "@/constants/route.const";
import { stripLocalePrefix } from "@/translations/locales";



type AccountMenuProps = {
  className?: string;
  menuClassName?: string;
  onAction?: () => void;
  onLogoutRequest: () => void;
  role: UserRole | null;
  textClassName?: string;
  whatsappNumber?: string;
};

function AccountMenu({
  className,
  menuClassName,
  onAction,
  onLogoutRequest,
  role,
  textClassName,
  whatsappNumber,
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
        <span className="min-w-0 text-wrap-safe">
          {whatsappNumber ? `+91 ${whatsappNumber}` : labels.myAccount}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
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
            href={APP_ROUTES.userMyPoojas}
            onClick={closeMenu}
            className="flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 text-left font-bold leading-5 transition-colors hover:bg-orange-50 hover:text-saffron"
          >
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
            <span className="min-w-0 text-wrap-safe">{labels.myPoojas}</span>
          </Link>

          {canAccessAdmin(role) && (
            <Link
              href={APP_ROUTES.admin}
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
                <span className="min-w-0 text-wrap-safe">
                  {labels.changeNumber}
                </span>
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
  const { language, t } = useLanguage();
  const accountText = accountLabels[language];
  const { showToast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const whatsappNumber = useAuthStore((state) => state.whatsappNumber);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentPathname = stripLocalePrefix(pathname).pathnameWithoutLocale;
  const isHomePage = currentPathname === APP_ROUTES.home;
  const isPoojasPage =
    currentPathname === APP_ROUTES.poojas ||
    currentPathname.startsWith(`${APP_ROUTES.poojas}/`);
  const isPanchangPage = currentPathname === SECTION_ROUTES.panchang;
  const isTemplesPage =
    currentPathname === APP_ROUTES.temples ||
    currentPathname.startsWith(`${APP_ROUTES.temples}/`);
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
  }

  useEffect(() => {
    const updateNavbar = () => setIsScrolled(window.scrollY > 16);

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    return () => window.removeEventListener("scroll", updateNavbar);
  }, []);


  useEffect(() => {
    let isActive = true;

    function syncStoredAuthState() {
      setIsLoggedIn(isClientLoggedIn());
      setUserRole(getClientUserRole());
      setIsAuthChecked(true);
    }

    async function verifyAuthState() {
      const storedRole = getClientUserRole();

      if (isClientLoggedIn() && storedRole) {
        if (!isActive) return;

        setIsLoggedIn(true);
        setUserRole(storedRole);
        setIsAuthChecked(true);
      }

      try {
        const refreshedRole = await refreshAuthSession();

        if (!isActive) return;

        setIsLoggedIn(true);
        setUserRole(refreshedRole);
      } catch {
        if (!isActive) return;

        setIsLoggedIn(false);
        setUserRole(null);
      } finally {
        if (isActive) setIsAuthChecked(true);
      }
    }

    const handleSessionChange = () => syncStoredAuthState();

    void verifyAuthState();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      isActive = false;
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChange,
      );
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);


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


      <Dialog open={isMobileAccountOpen} onOpenChange={setIsMobileAccountOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron/10 text-saffron">
              <UserCircle className="h-7 w-7" />
            </div>
            <DialogTitle>{accountText.myAccount}</DialogTitle>
            <DialogDescription>
              {whatsappNumber ? `+91 ${whatsappNumber}` : accountText.myAccount}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2">
            <Link
              href={APP_ROUTES.userMyPoojas}
              onClick={() => setIsMobileAccountOpen(false)}
              className="flex min-h-12 items-start gap-3 rounded-xl border border-black/10 px-4 py-3 text-left font-bold leading-5 text-text-primary transition-colors hover:border-saffron hover:text-saffron"
            >
              <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
              <span className="min-w-0 text-wrap-safe">{accountText.myPoojas}</span>
            </Link>

            {canAccessAdmin(userRole) && (
              <Link
                href={APP_ROUTES.admin}
                onClick={() => setIsMobileAccountOpen(false)}
                className="flex min-h-12 items-start gap-3 rounded-xl border border-black/10 px-4 py-3 text-left font-bold leading-5 text-text-primary transition-colors hover:border-saffron hover:text-saffron"
              >
                <LayoutDashboard className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                <span className="min-w-0 text-wrap-safe">Admin Panel</span>
              </Link>
            )}

            <WhatsAppLoginModal
              triggerContent={
                <>
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                  <span className="min-w-0 text-wrap-safe">
                    {accountText.changeNumber}
                  </span>
                </>
              }
              triggerClassName="flex min-h-12 h-auto w-full items-start justify-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-base font-bold leading-5 text-text-primary shadow-none hover:border-saffron hover:bg-white hover:text-saffron md:px-4"
              onTriggerClick={() => setIsMobileAccountOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />

            <button
              type="button"
              onClick={() => {
                setIsMobileAccountOpen(false);
                setIsLogoutDialogOpen(true);
              }}
              className="flex min-h-12 w-full items-start gap-3 rounded-xl border border-red-100 px-4 py-3 text-left font-bold leading-5 text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 text-wrap-safe">{accountText.logout}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
<header
        className={cn(
          "top-0 z-50 flex h-14 w-full items-center border-b transition-colors duration-300 md:h-20",
          isHomePage ? "fixed" : "sticky",
          isTransparent
            ? "border-transparent bg-transparent"
            : "border-black/10 bg-white/90 shadow-sm shadow-black/5 backdrop-blur-xl md:bg-white/75",
        )}
      >
        <div className="flex h-full w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-5 md:px-7 lg:px-16">
          <div className="flex h-full min-w-0 items-center gap-4 md:gap-8">
            <Link
              href={APP_ROUTES.home}
              aria-label="Yaagam home"
              className="flex h-full shrink-0 items-center text-saffron"
            >
              <Image
                src="/logo_png.png"
                width="72"
                height="72"
                alt={"yaagam_logo"}
                className="h-11 w-auto object-contain md:h-16"
              />
            </Link>

            <nav
              aria-label={t.nav.mainNavigation}
              className={`hidden h-full items-center gap-1 font-bold transition-colors duration-300 md:flex md:gap-2 ${isTransparent ? "text-white" : "text-text-primary"
                }`}
            >
              <Link
                href={APP_ROUTES.home}
                aria-current={isHomePage ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 items-center gap-2 px-2 py-2 transition-colors hover:text-saffron md:px-3",
                  isHomePage && "text-saffron",
                )}
              >
                <span className="text-wrap-safe">{t.nav.home}</span>
              </Link>

              <Link
                href={APP_ROUTES.poojas}
                aria-current={isPoojasPage ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 items-center gap-2 px-2 py-2 transition-colors hover:text-saffron md:px-3",
                  isPoojasPage && "text-saffron",
                )}
              >
                <span className="text-wrap-safe">{t.nav.poojas}</span>
              </Link>

              <Link
                href={APP_ROUTES.temples}
                aria-current={isTemplesPage ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 items-center gap-2 px-2 py-2 transition-colors hover:text-saffron md:px-3",
                  isTemplesPage && "text-saffron",
                )}
              >
                <span className="text-wrap-safe">{t.nav.temples}</span>
              </Link>
              <Link
                href={SECTION_ROUTES.panchang}
                aria-current={isPanchangPage ? "page" : undefined}
                className={cn(
                  "relative hidden min-h-12 items-center gap-2 px-3 py-2 transition-colors hover:text-saffron after:absolute after:bottom-1 after:left-3 after:h-0.5 after:w-0 after:bg-saffron after:transition-all lg:flex",
                  isPanchangPage && "text-saffron after:w-[calc(100%-1.5rem)]",
                )}
              >
                <span className="text-wrap-safe">{t.nav.panchang}</span>
                <span className="rounded-full text-[10px] font-extrabold uppercase leading-none text-saffron">
                  Coming Soon
                </span>
              </Link>
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
            <LanguageSelector
              className={isTransparent ? "text-white" : "text-text-primary"}
            />

            {!isAuthChecked ? (
              <div className="h-12 w-32" aria-hidden="true" />
            ) : isLoggedIn ? (
              <AccountMenu
                onLogoutRequest={() => setIsLogoutDialogOpen(true)}
                role={userRole}
                whatsappNumber={whatsappNumber}
                textClassName={
                  isTransparent ? "text-white" : "text-text-primary"
                }
              />
            ) : (
              <WhatsAppLoginModal onLoginSuccess={handleLoginSuccess} />
            )}
          </div>

          <div className="flex shrink-0 items-center md:hidden">
            <LanguageSelector
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-sm font-extrabold leading-5 shadow-sm transition-colors hover:border-saffron hover:text-saffron",
                isTransparent
                  ? "border-white/45 bg-black/10 text-white backdrop-blur-sm"
                  : "border-saffron/30 bg-white text-text-primary",
              )}
              menuClassName="right-0 top-[calc(100%+0.35rem)] min-w-40"
            />
          </div>
        </div>
      </header>
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed inset-x-0 bottom-0 z-80 border-t border-black/10 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(23,15,9,0.1)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-5 items-center">
          <Link href={APP_ROUTES.home} aria-current={isHomePage ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-0.5 text-xs font-semibold leading-4 text-text-primary/60", isHomePage && "text-saffron")}>
            <Home className="h-5 w-5" />
            <span className="text-wrap-safe">{t.nav.home}</span>
          </Link>
          <Link href={APP_ROUTES.poojas} aria-current={isPoojasPage ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-0.5 text-xs font-semibold leading-4 text-text-primary/60", isPoojasPage && "text-saffron")}>
            <Flower className="h-5 w-5" />
            <span className="text-wrap-safe">{t.nav.poojas}</span>
          </Link>
          <Link href={APP_ROUTES.temples} aria-current={isTemplesPage ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-0.5 text-xs font-semibold leading-4 text-text-primary/60", isTemplesPage && "text-saffron")}>
            <MapPin className="h-5 w-5" />
            <span className="text-wrap-safe">{t.nav.temples}</span>
          </Link>
          <Link href={SECTION_ROUTES.panchang} aria-current={isPanchangPage ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-0.5 text-xs font-semibold leading-4 text-text-primary/60", isPanchangPage && "text-saffron")}>
            <Sparkles className="h-5 w-5" />
            <span className="text-wrap-safe">{t.nav.panchang}</span>
          </Link>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsMobileAccountOpen(true)}
              className="flex min-w-0 flex-col items-center gap-0.5 text-xs font-semibold leading-4 text-text-primary/60 hover:text-saffron"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-wrap-safe">Profile</span>
            </button>
          ) : (
            <WhatsAppLoginModal
              onLoginSuccess={handleLoginSuccess}
              triggerContent={
                <>
                  <UserCircle className="h-5 w-5" />
                  <span className="text-wrap-safe">Profile</span>
                </>
              }
              triggerClassName="flex h-auto min-h-0 min-w-0 flex-col items-center gap-0.5 rounded-none bg-transparent p-0 text-xs font-semibold leading-4 text-text-primary/60 shadow-none hover:bg-transparent hover:text-saffron md:p-0"
            />
          )}
        </div>
      </nav>
    </>
  );
}
