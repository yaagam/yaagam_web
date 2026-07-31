"use client";

import { useEffect, useState } from "react";

export function usePaymentCountdown(expiresAt?: string, serverTime?: string) {
  const timingKey = expiresAt && serverTime ? `${expiresAt}|${serverTime}` : "";
  const [countdown, setCountdown] = useState({
    timingKey: "",
    remainingMs: 0,
  });

  useEffect(() => {
    if (!expiresAt || !serverTime) return;
    const serverOffset = Date.parse(serverTime) - Date.now();
    const calculate = () =>
      setCountdown({
        timingKey,
        remainingMs: Math.max(
          0,
          Date.parse(expiresAt) - (Date.now() + serverOffset),
        ),
      });

    calculate();
    const timer = window.setInterval(calculate, document.hidden ? 5000 : 1000);
    document.addEventListener("visibilitychange", calculate);
    window.addEventListener("focus", calculate);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", calculate);
      window.removeEventListener("focus", calculate);
    };
  }, [expiresAt, serverTime, timingKey]);

  const remainingMs =
    timingKey && countdown.timingKey === timingKey
      ? countdown.remainingMs
      : null;
  const totalSeconds = Math.ceil((remainingMs ?? 0) / 1000);
  return {
    remainingMs: remainingMs ?? 0,
    ready: remainingMs !== null,
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    expired: Boolean(
      expiresAt && serverTime && remainingMs !== null && remainingMs === 0,
    ),
  };
}
