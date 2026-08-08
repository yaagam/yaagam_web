"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";

import {
  ChevronDown,
  Home,
  ListChecks,
  LogIn,
  LogOut,
  MessageCircle,
  Phone,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
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
  getClientWhatsappNumber,
  isClientLoggedIn,
} from "@/lib/auth/client-session";
import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { useAuthStore } from "@/lib/auth/auth.store";
import { logoutApi } from "@/lib/api/user/logout.api";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/roles";
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
  textClassName?: string;
  whatsappNumber?: string;
};

function AccountMenu({
  className,
  menuClassName,
  onAction,
  onLogoutRequest,
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
          "flex min-h-12 min-w-0 items-center gap-2 px-3 py-2 text-left text-base font-medium leading-5 transition-colors hover:text-saffron",
          textClassName,
        )}
      >
        <UserCircle className="h-5 w-5 shrink-0" />
        <span className="min-w-0 text-wrap-safe">{labels.myAccount}</span>
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
            "absolute right-0 top-[calc(100%+0.5rem)] z-60 w-56 rounded-lg border border-black/10 bg-white p-2 text-text-primary shadow-2xl shadow-black/20",
            menuClassName,
          )}
        >
          <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-text-primary/45">
            {labels.myAccount}
          </p>

          {whatsappNumber && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-black/4 px-2 py-1.5">
              <UserCircle className="h-4 w-4 shrink-0 text-saffron" />
              <span className="min-w-0 text-wrap-safe text-[12px] font-semibold leading-5 text-text-primary/70">
                +91 {whatsappNumber}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href={APP_ROUTES.userMyPoojas}
              onClick={closeMenu}
              className="flex min-h-9 items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm font-semibold leading-5 transition-colors hover:bg-saffron/10 hover:text-saffron"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-saffron/10 text-saffron">
                <ListChecks className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-wrap-safe">
                {labels.myPoojas}
              </span>
            </Link>

            <WhatsAppLoginModal
              triggerContent={
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-saffron/10 text-saffron">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-wrap-safe">
                    {labels.changeNumber}
                  </span>
                </>
              }
              triggerClassName="flex min-h-9 h-auto w-full items-center justify-start gap-3 rounded-md bg-transparent px-2.5 py-1.5 text-left text-sm font-semibold leading-5 text-text-primary shadow-none hover:bg-saffron/10 hover:text-saffron md:px-2.5"
              onTriggerClick={() => setOpen(false)}
            />

            <button
              type="button"
              onClick={() => {
                closeMenu();
                onLogoutRequest();
              }}
              className="flex min-h-9 w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-sm font-semibold leading-5 transition-colors hover:bg-red-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-50 text-red-500">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-wrap-safe text-red-500">
                {labels.logout}
              </span>
            </button>
          </div>
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
  const [, setUserRole] = useState<UserRole | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const storedWhatsappNumber = useAuthStore((state) => state.whatsappNumber);
  const whatsappNumber = storedWhatsappNumber || getClientWhatsappNumber();
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const handleSupportState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsSupportOpen(customEvent.detail.isOpen);
    };
    window.addEventListener("support-chat-state-changed", handleSupportState);
    return () => window.removeEventListener("support-chat-state-changed", handleSupportState);
  }, []);

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
    const isAccountPage = currentPathname === APP_ROUTES.userMyPoojas || isMobileAccountOpen;
    const mobileActiveIndex = isSupportOpen
      ? 4
      : isPoojasPage
        ? 1
        : isTemplesPage
          ? 2
          : isAccountPage
            ? 3
            : 0;
  const isTransparent = isHomePage && !isScrolled;
  const isHomeScrolled = isHomePage && isScrolled;

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
              className="min-h-11 rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-60"
            >
              {LOGOUT_CANCEL_LABEL}
            </button>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={confirmLogout}
              className="min-h-11 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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

            <WhatsAppLoginModal
              triggerContent={
                <>
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                  <span className="min-w-0 text-wrap-safe">
                    {accountText.changeNumber}
                  </span>
                </>
              }
              triggerClassName="flex min-h-12 h-auto w-full items-start justify-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-base font-medium leading-5 text-text-primary shadow-none hover:border-saffron hover:bg-white hover:text-saffron md:px-4"
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
          "top-0 z-50 flex h-14 w-full items-center border-b transition-all duration-500 ease-in-out md:h-20",
          isHomePage ? "fixed" : "sticky",
          isTransparent
            ? "border-transparent bg-transparent"
            : isHomeScrolled
              ? "border-black/10 bg-white/85 shadow-sm shadow-black/5 backdrop-blur-2xl"
              : "border-black/10 bg-white/85 shadow-sm shadow-black/5 backdrop-blur-2xl",
        )}
      >
        <div
          className={cn(
            "mx-auto mt-0 flex h-full w-full min-w-0 items-center justify-between gap-3 rounded-none border border-transparent px-3 transition-all duration-500 ease-in-out sm:px-5 md:px-7 lg:px-16",
            isTransparent &&
              "mt-2 h-11 w-[calc(100%-3rem)] rounded-full border-black/10 bg-white/85 shadow-lg shadow-black/10 backdrop-blur-2xl sm:w-[calc(100%-3.5rem)] md:mt-3 md:h-[calc(100%-0.75rem)] md:w-[calc(100%-3rem)]",
          )}
        >
          <div className="flex h-full min-w-0 items-center gap-4 md:gap-8">
            <Link
              href={APP_ROUTES.home}
              aria-label="Yaagam home"
              className="flex h-full shrink-0 items-center text-saffron"
            >
              <Image
                src={isTransparent ? "/logo_png.png" : "/logo_png.png"}
                width="72"
                height="72"
                alt={"yaagam_logo"}
                className="h-10 w-auto object-contain md:h-12"
              />
            </Link>

            <nav
              aria-label={t.nav.mainNavigation}
              className={`hidden h-full items-center gap-1 font-medium transition-colors duration-300 md:flex md:gap-2 ${isTransparent ? "text-text-primary" : "text-text-primary"
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
                <span className="rounded-full text-[10px] font-semibold uppercase leading-none text-saffron">
                  Coming Soon
                </span>
              </Link>
            </nav>
          </div>

          <div
            className={cn(
              "hidden shrink-0 items-center overflow-visible rounded-full border shadow-sm backdrop-blur-md transition-all md:flex",
              isTransparent
                ? "border-white/30 bg-white/12 shadow-black/10"
                : "border-black/10 bg-white shadow-black/5",
            )}
          >
            <LanguageSelector
              className={cn(
                "min-h-10 rounded-l-full px-3 py-2 text-sm font-medium transition-all hover:text-saffron focus-visible:ring-2 focus-visible:ring-saffron/20",
                isTransparent
                  ? "text-text-primary hover:bg-black/5"
                  : "text-text-primary hover:bg-saffron/5",
              )}
            />

            <span
              aria-hidden="true"
              className={cn(
                "h-5 w-px shrink-0",
                isTransparent ? "bg-black/10" : "bg-black/10",
              )}
            />

            {!isAuthChecked ? (
              <div className="h-10 w-32" aria-hidden="true" />
            ) : isLoggedIn ? (
              <AccountMenu
                onLogoutRequest={() => setIsLogoutDialogOpen(true)}
                whatsappNumber={whatsappNumber}
                textClassName={cn(
                  "min-h-10 rounded-r-full px-3 py-2 text-sm font-medium transition-all hover:text-saffron focus-visible:ring-2 focus-visible:ring-saffron/20",
                  isTransparent
                  ? "text-text-primary hover:bg-black/5"
                  : "text-text-primary hover:bg-saffron/5",
                )}
              />
            ) : (
              <WhatsAppLoginModal
                onLoginSuccess={handleLoginSuccess}
                triggerContent={
                  <>
                    <LogIn className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 text-wrap-safe">
                      {t.login.button}
                    </span>
                  </>
                }
                triggerClassName={cn(
                  "flex h-auto min-h-10 items-center gap-2 rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-900/15 transition-all hover:bg-[#c96c1a] hover:text-white md:px-4",
                  isTransparent && "ring-1 ring-black/10",
                )}
              />
            )}
          </div>

          <div className="flex shrink-0 items-center md:hidden">
            <LanguageSelector
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium leading-5 shadow-sm transition-colors hover:border-saffron hover:text-saffron",
                isTransparent
                  ? "border-black/20 bg-black/5 text-text-primary backdrop-blur-sm"
                  : "border-saffron/30 bg-white text-text-primary",
              )}
              menuClassName="right-0 top-[calc(100%+0.35rem)] min-w-40"
            />
          </div>
        </div>
      </header>
      <nav
        aria-label="Mobile bottom navigation"
        className="site-mobile-bottom-nav fixed inset-x-4 bottom-6 z-80 rounded-[2rem] border border-white/10 bg-[#0d296e] pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_12px_32px_rgba(13,41,110,0.4)] md:hidden"
      >
        <div className="relative mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          <span
            aria-hidden="true"
            className="absolute top-[-16px] z-0 h-[64px] w-[64px] rounded-full bg-saffron shadow-[0_4px_16px_rgba(230,126,34,0.5)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ left: `calc(${mobileActiveIndex} * 20% + 10% - 32px)` }}
          />
          <Link href={APP_ROUTES.home} aria-current={isHomePage ? "page" : undefined} className={cn("relative z-10 flex h-16 min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500", isHomePage ? "text-white" : "text-white/60 hover:text-white/90")}>
            <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isHomePage ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
              <Home className={cn("h-6 w-6 transition-all duration-500", isHomePage ? "stroke-[2.5]" : "stroke-[2.2]")} />
            </div>
            <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isHomePage ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>{t.nav.home}</span>
          </Link>
          <Link href={APP_ROUTES.poojas} aria-current={isPoojasPage ? "page" : undefined} className={cn("relative z-10 flex h-16 min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500", isPoojasPage ? "text-white" : "text-white/60 hover:text-white/90")}>
            <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isPoojasPage ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
              <PublicSvgIcon name="pooja" width={24} height={24} className={cn("h-6 w-6 object-contain brightness-0 invert transition-opacity duration-500", isPoojasPage ? "opacity-100" : "opacity-60")} />
            </div>
            <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isPoojasPage ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>{t.nav.poojas}</span>
          </Link>
          <Link href={APP_ROUTES.temples} aria-current={isTemplesPage ? "page" : undefined} className={cn("relative z-10 flex h-16 min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500", isTemplesPage ? "text-white" : "text-white/60 hover:text-white/90")}>
            <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isTemplesPage ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
              <PublicSvgIcon name="temple" width={24} height={24} className={cn("h-6 w-6 scale-x-150 object-contain brightness-0 invert transition-opacity duration-500", isTemplesPage ? "opacity-100" : "opacity-60")} />
            </div>
            <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isTemplesPage ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>{t.nav.temples}</span>
          </Link>
          {isLoggedIn ? (
            <button type="button" onClick={() => setIsMobileAccountOpen(true)} className={cn("relative z-10 flex h-16 min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500", isAccountPage ? "text-white" : "text-white/60 hover:text-white/90")}>
              <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isAccountPage ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
                <UserCircle className={cn("h-6 w-6 transition-all duration-500", isAccountPage ? "stroke-[2.5]" : "stroke-[2.2]")} />
              </div>
              <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isAccountPage ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>{accountText.myAccount}</span>
            </button>
          ) : (
            <WhatsAppLoginModal
              onLoginSuccess={handleLoginSuccess}
              triggerContent={
                <>
                  <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isAccountPage && !isSupportOpen ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
                    <LogIn className={cn("h-6 w-6 transition-all duration-500", isAccountPage && !isSupportOpen ? "stroke-[2.5]" : "stroke-[2.2]")} />
                  </div>
                  <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isAccountPage && !isSupportOpen ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>{t.login.button}</span>
                </>
              }
              triggerClassName={cn("relative z-10 flex h-16 w-full min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500 bg-transparent shadow-none", isAccountPage && !isSupportOpen ? "text-white" : "text-white/60 hover:text-white/90")}
            />
          )}
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('toggle-support-chat'))} className={cn("relative z-10 flex h-16 min-w-0 flex-col items-center justify-center px-1 text-xs font-medium leading-4 transition-all duration-500", isSupportOpen ? "text-white" : "text-white/60 hover:text-white/90")}>
            <div className={cn("absolute grid h-6 w-6 place-items-center rounded-full transition-all duration-500", isSupportOpen ? "top-1 -translate-y-2" : "top-1 translate-y-3")}>
              <MessageCircle className={cn("h-6 w-6 transition-all duration-500", isSupportOpen ? "stroke-[2.5]" : "stroke-[2.2]")} />
            </div>
            <span className={cn("absolute top-4 text-[10px] whitespace-nowrap transition-all duration-500", isSupportOpen ? "translate-y-[5px] font-semibold text-white" : "translate-y-7 opacity-100 text-white/60")}>Support</span>
          </button>
        </div>
      </nav>
    </>
  );
}
