"use client";

import { PaymentExperience } from "@/components/payment/payment-experience";
import type { PaymentSession } from "@/types/payment";

type Props = {
  session: PaymentSession;
  isProcessingPayment: boolean;
  onBack: () => void;
  onComplete: () => void;
};

export function PaymentMethodPage({
  session,
  isProcessingPayment,
  onBack,
  onComplete,
}: Props) {
  return (
    <div className="min-h-[calc(100dvh-5rem)] w-full bg-slate-50 py-3 sm:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <PaymentExperience
          session={session}
          isProcessingPayment={isProcessingPayment}
          onBack={onBack}
          onExpired={onBack}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
