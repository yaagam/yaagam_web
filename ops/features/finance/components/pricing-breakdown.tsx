"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePriceBreakdown, PLATFORM_FEE_GST_PERCENT } from "@/features/finance/utils/calculate-price-breakdown";

function currency(value: number | null) {
  return value === null ? "Unavailable" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function PricingBreakdown({ listPrice, effectiveCustomerPrice, templeAmount, noDiscountPrice = false }: { listPrice: unknown; effectiveCustomerPrice: unknown; templeAmount: unknown; noDiscountPrice?: boolean }) {
  const breakdown = calculatePriceBreakdown({ listPrice: Number(listPrice), effectiveCustomerPrice: Number(effectiveCustomerPrice), templeAmount: Number(templeAmount), gstPercentage: PLATFORM_FEE_GST_PERCENT });
  const rows = [
    ["List/base price", breakdown.listPrice],
    ["Effective customer price", breakdown.effectiveCustomerPrice],
    ["Temple payable", breakdown.templePayable],
    ["Gross platform margin", breakdown.grossPlatformMargin],
    ["Platform fee before GST", breakdown.platformFeeBeforeGst],
    ["GST on platform fee", breakdown.platformFeeGst],
    ["Customer pays", breakdown.customerPays],
  ] as const;
  return <Card className="bg-muted/30 lg:col-span-2"><CardHeader><CardTitle className="text-base">Price Breakdown Preview</CardTitle><p className="text-sm text-muted-foreground">Estimated preview. Final booking amounts are calculated by the backend.</p></CardHeader><CardContent className="space-y-4">
    {noDiscountPrice && <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">No discounted price — base price will be charged.</p>}
    {breakdown.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{breakdown.error}</p>}
    {breakdown.available && breakdown.discountAmount !== null && breakdown.discountAmount > 0 && <p className="text-sm font-medium text-emerald-700">Discount: {currency(breakdown.discountAmount)} ({breakdown.discountPercentage?.toFixed(2)}%)</p>}
    <dl className="grid gap-3 sm:grid-cols-2">{rows.map(([label,value])=><div key={label} className="rounded-md border border-border bg-card px-3 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{breakdown.available ? currency(value) : "Unavailable"}</dd></div>)}<div className="rounded-md border border-border bg-card px-3 py-2"><dt className="text-xs text-muted-foreground">GST percentage</dt><dd className="mt-1 font-semibold">{PLATFORM_FEE_GST_PERCENT}%</dd></div></dl>
  </CardContent></Card>;
}
