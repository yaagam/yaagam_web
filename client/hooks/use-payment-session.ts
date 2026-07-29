"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { cancelPayment, getPaymentStatus, retryPayment, toPaymentError } from "@/lib/payment/payment-api";
import { canTransition, terminalPaymentStatuses } from "@/lib/payment/payment-machine";
import { trackPaymentEvent } from "@/lib/payment/payment-observability";
import type { PaymentError, PaymentSession, PaymentSnapshot, PaymentStatus } from "@/types/payment";

type State = {
  status: PaymentStatus;
  snapshot: PaymentSnapshot;
  error: PaymentError | null;
  actionPending: boolean;
  online: boolean;
};

type Action =
  | { type: "snapshot"; snapshot: PaymentSnapshot }
  | { type: "error"; error: PaymentError }
  | { type: "action"; pending: boolean }
  | { type: "online"; online: boolean };

function reducer(state: State, action: Action): State {
  if (action.type === "snapshot") {
    if (!canTransition(state.status, action.snapshot.status)) return state;
    return { ...state, status: action.snapshot.status, snapshot: action.snapshot, error: null };
  }
  if (action.type === "error") return { ...state, error: action.error };
  if (action.type === "action") return { ...state, actionPending: action.pending };
  return { ...state, online: action.online, error: action.online ? state.error : toPaymentError(new Error("offline")) };
}

function initialSnapshot(session: PaymentSession): PaymentSnapshot {
  return {
    status: session.status ?? (session.kind === "subscription" ? "subscription_pending" : "pending"),
    expiresAt: session.expiresAt ?? "",
    serverTime: session.serverTime ?? "",
    qrPayload: session.qrPayload,
    qrImageUrl: session.qrImageUrl,
    correlationId: session.correlationId,
    redirectUrl: session.redirectUrl,
  };
}

export function usePaymentSession(session: PaymentSession) {
  const snapshot = initialSnapshot(session);
  const [state, dispatch] = useReducer(reducer, {
    status: snapshot.status, snapshot, error: null, actionPending: false, online: true,
  });
  const failures = useRef(0);

  useEffect(() => {
    const setOnline = () => dispatch({ type: "online", online: navigator.onLine });
    setOnline();
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOnline);
    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOnline);
    };
  }, []);

  useEffect(() => {
    if (!session.publicToken || terminalPaymentStatuses.has(state.status)) return;
    const controller = new AbortController();
    let timer = 0;

    const poll = async () => {
      if (!navigator.onLine || document.hidden) {
        timer = window.setTimeout(poll, 4000);
        return;
      }
      try {
        const next = await getPaymentStatus(session.publicToken!, state.snapshot.correlationId, controller.signal);
        failures.current = 0;
        dispatch({ type: "snapshot", snapshot: next });
        if (!terminalPaymentStatuses.has(next.status)) {
          timer = window.setTimeout(poll, next.status === "processing" ? 1800 : 3000);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        failures.current += 1;
        dispatch({ type: "error", error: toPaymentError(error) });
        timer = window.setTimeout(poll, Math.min(15000, 2000 * 2 ** failures.current));
      }
    };
    void poll();
    const wake = () => { window.clearTimeout(timer); void poll(); };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [session.publicToken, state.snapshot.correlationId, state.status]);

  const runAction = useCallback(async (kind: "cancel" | "retry") => {
    if (!session.publicToken || state.actionPending) return;
    dispatch({ type: "action", pending: true });
    try {
      const next = kind === "cancel"
        ? await cancelPayment(session.publicToken, state.snapshot.correlationId)
        : await retryPayment(session.publicToken, state.snapshot.correlationId);
      dispatch({ type: "snapshot", snapshot: next });
      trackPaymentEvent(kind === "cancel" ? "payment_cancelled" : "payment_retry", next.correlationId);
    } catch (error) {
      dispatch({ type: "error", error: toPaymentError(error) });
    } finally {
      dispatch({ type: "action", pending: false });
    }
  }, [session.publicToken, state.actionPending, state.snapshot.correlationId]);

  return { ...state, cancel: () => runAction("cancel"), retry: () => runAction("retry") };
}
