"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WhatsappPhoneInput } from "@/components/ui/whatsapp-phone-input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { cn, getErrorMessage } from "@/lib/utils";
import { sendOtpApi } from "@/lib/api/user/send-otp.api";
import { verifyOtpApi } from "@/lib/api/user/verify-otp.api";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  markClientLoggedIn,
  markClientWhatsappNumber,
} from "@/lib/auth/client-session";
import type { UserRole } from "@/lib/auth/roles";
import { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import {
  formatWhatsappNumber,
  isValidWhatsappNumber,
  normalizeWhatsappNumber,
} from "@/lib/phone";

type LoginStep = "phone" | "otp";

const SESSION_EXPIRED_ERROR = "Session Expired";
const ENTER_NUMBER_AGAIN_ERROR = "Enter number again";

type WhatsAppLoginModalProps = {
  triggerClassName?: string;
  triggerContent?: ReactNode;
  triggerVariant?: "button" | "link";
  onTriggerClick?: () => void;
  onLoginSuccess?: (role: UserRole | null) => void;
};

export function WhatsAppLoginModal({
  triggerClassName,
  triggerContent,
  triggerVariant = "button",
  onTriggerClick,
  onLoginSuccess,
}: WhatsAppLoginModalProps = {}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const input =
      step === "phone" ? phoneInputRef.current : otpInputRef.current;
    window.setTimeout(() => input?.focus(), 50);
  }, [open, step]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      window.setTimeout(() => {
        setStep("phone");
        setPhone("");
        setOtp("");
        setError("");
      }, 200);
    }
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    setError("");
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setError("");
  }

  async function getRoleAfterLogin(fallbackRole: UserRole | null) {
    if (fallbackRole) return fallbackRole;

    try {
      return refreshAuthSession();
    } catch {
      return null;
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidWhatsappNumber(phone)) {
      const message = t.login.invalidPhone;
      setError(message);
      return;
    }

    try {
      await sendOtpApi(normalizeWhatsappNumber(phone));
      setStep("otp");
      setError("");
    } catch (error: unknown) {
      setError(getErrorMessage(error, t.login.sendError));
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      const message = t.login.invalidCode;
      setError(message);
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const authResult = await verifyOtpApi(otp);
      const role = await getRoleAfterLogin(authResult.role);
      const whatsappNumber = normalizeWhatsappNumber(
        authResult.whatsappNumber || phone,
      );
      setError("");
      markClientWhatsappNumber(whatsappNumber);
      markClientLoggedIn(
        role,
        authResult.userId
          ? { id: authResult.userId, whatsappNumber }
          : { whatsappNumber },
      );
      onLoginSuccess?.(role);
      showToast("success", t.login.success);
      handleOpenChange(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error, t.login.verifyError);

      if (message === SESSION_EXPIRED_ERROR) {
        setStep("phone");
        setPhone("");
        setOtp("");
        setError(ENTER_NUMBER_AGAIN_ERROR);
        return;
      }

      setError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {triggerVariant === "link" ? (
            <button
              type="button"
              className={cn(
                "inline border-0 bg-transparent p-0 text-left font-extrabold leading-[inherit] text-saffron underline-offset-2 hover:text-[#c96c1a] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-saffron",
                triggerClassName,
              )}
              onClick={onTriggerClick}
            >
              {triggerContent ?? t.login.button}
            </button>
          ) : (
            <Button
              variant="default"
              className={cn(
                "min-h-12 h-auto whitespace-normal rounded-full bg-saffron px-5 py-2.5 text-center text-base font-medium leading-6 hover:bg-[#c96c1a] md:px-7",
                triggerClassName,
              )}
              onClick={onTriggerClick}
            >
              {triggerContent ?? t.login.button}
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-h-[calc(100svh-2rem)] max-w-lg overflow-y-auto wrap-break-word">
          {step === "phone" && (
            <>
              <DialogHeader className="px-5 sm:px-8">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#1faa52]">
                  <WhatsAppIcon className="h-8 w-8" />
                </div>
                <DialogTitle className="text-xl leading-8 sm:text-2xl">
                  {t.login.welcome}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 sm:text-base sm:leading-7">
                  {t.login.phoneDescription}
                </DialogDescription>
              </DialogHeader>

              <form className="mt-2 space-y-4" onSubmit={requestOtp} noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="whatsapp-phone"
                    className="text-sm font-medium text-text-primary"
                  >
                    {t.login.phoneLabel}
                  </label>
                  <WhatsappPhoneInput
                    inputRef={phoneInputRef}
                    id="whatsapp-phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    invalid={Boolean(error)}
                    describedBy={error ? "login-error" : undefined}
                  />
                  {error && (
                    <p
                      id="login-error"
                      className="wrap-break-word text-sm font-semibold leading-6 text-red-600"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="xl"
                  className="min-h-12 h-auto w-full whitespace-normal px-5 py-3 text-center text-base leading-6 sm:text-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <WhatsAppIcon className="h-5 w-5 shrink-0" />
                    <span>{t.login.sendOtp}</span>
                  </span>
                </Button>

                <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-text-primary/55 sm:px-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{t.login.privacy}</span>
                </p>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <DialogHeader className="px-5 sm:px-8">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600/10 text-green-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <DialogTitle className="text-xl leading-8 sm:text-2xl">
                  {t.login.verifyTitle}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 sm:text-base sm:leading-7">
                  {t.login.codeSent}{" "}
                  <strong className="text-text-primary">
                    {formatWhatsappNumber(phone)}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              <form className="mt-2 space-y-4" onSubmit={verifyOtp} noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="whatsapp-otp"
                    className="text-sm font-medium text-text-primary"
                  >
                    {t.login.codeLabel}
                  </label>
                  <Input
                    ref={otpInputRef}
                    id="whatsapp-otp"
                    type="text"
                    inputMode="tel"
                    autoComplete="one-time-code"
                    value={otp}
                    disabled={isVerifyingOtp}
                    onChange={(event) => handleOtpChange(event.target.value)}
                    placeholder="000000"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "otp-error" : undefined}
                    className="h-14 text-center text-2xl font-extrabold tracking-[0.45em]"
                  />
                  {error && (
                    <p
                      id="otp-error"
                      className="wrap-break-word text-sm font-semibold leading-6 text-red-600"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="xl"
                  disabled={isVerifyingOtp}
                  aria-busy={isVerifyingOtp}
                  className="min-h-12 h-auto w-full whitespace-normal px-5 py-3 text-center text-base leading-6 sm:text-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isVerifyingOtp && (
                      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
                    )}
                    <span>{isVerifyingOtp ? "Verifying..." : t.login.verify}</span>
                  </span>
                </Button>

                <div className="flex flex-col items-stretch gap-2 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="min-h-10 rounded-lg px-3 py-2 text-center leading-5 text-text-primary/65 hover:bg-saffron/5 hover:text-saffron"
                    onClick={() => setStep("phone")}
                  >
                    {t.login.changeNumber}
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg px-3 py-2 text-center leading-5 text-saffron hover:bg-saffron/5 hover:text-[#c96c1a]"
                    onClick={() => setOtp("")}
                  >
                    {t.login.resend}
                  </button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
