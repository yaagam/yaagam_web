"use client";

import { useEffect, useState } from "react";

export function usePaymentCountdown(expiresAt?: string, serverTime?: string) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!expiresAt || !serverTime) return;
    const serverOffset = Date.parse(serverTime) - Date.now();
    const calculate = () =>
      setRemainingMs(Math.max(0, Date.parse(expiresAt) - (Date.now() + serverOffset)));

    calculate();
    const timer = window.setInterval(calculate, document.hidden ? 5000 : 1000);
    document.addEventListener("visibilitychange", calculate);
    window.addEventListener("focus", calculate);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", calculate);
      window.removeEventListener("focus", calculate);
    };
  }, [expiresAt, serverTime]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  return {
    remainingMs,
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    expired: Boolean(expiresAt && serverTime && remainingMs === 0),
  };
}
