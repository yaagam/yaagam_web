// Preview-only. This public value must remain aligned with the backend pricing configuration.
export const PLATFORM_FEE_GST_PERCENT = 18;

export type PriceBreakdown = {
  available: boolean;
  listPrice: number | null;
  effectiveCustomerPrice: number | null;
  templePayable: number | null;
  grossPlatformMargin: number | null;
  platformFeeBeforeGst: number | null;
  gstPercentage: number;
  platformFeeGst: number | null;
  customerPays: number | null;
  discountAmount: number | null;
  discountPercentage: number | null;
  error: string | null;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePriceBreakdown({ listPrice, effectiveCustomerPrice, templeAmount, gstPercentage = PLATFORM_FEE_GST_PERCENT }: { listPrice: number; effectiveCustomerPrice: number; templeAmount: number; gstPercentage?: number }): PriceBreakdown {
  const unavailable = (error: string | null): PriceBreakdown => ({ available: false, listPrice: null, effectiveCustomerPrice: null, templePayable: null, grossPlatformMargin: null, platformFeeBeforeGst: null, gstPercentage, platformFeeGst: null, customerPays: null, discountAmount: null, discountPercentage: null, error });
  if (![listPrice, effectiveCustomerPrice, templeAmount, gstPercentage].every(Number.isFinite) || listPrice <= 0 || effectiveCustomerPrice <= 0 || templeAmount <= 0 || gstPercentage < 0) return unavailable(null);
  const grossPlatformMargin = effectiveCustomerPrice - templeAmount;
  if (grossPlatformMargin < 0) return unavailable("Effective customer price cannot be less than the temple payable amount.");
  const platformFeeBeforeGst = grossPlatformMargin / (1 + gstPercentage / 100);
  const discountAmount = Math.max(0, listPrice - effectiveCustomerPrice);
  return {
    available: true,
    listPrice: roundMoney(listPrice),
    effectiveCustomerPrice: roundMoney(effectiveCustomerPrice),
    templePayable: roundMoney(templeAmount),
    grossPlatformMargin: roundMoney(grossPlatformMargin),
    platformFeeBeforeGst: roundMoney(platformFeeBeforeGst),
    gstPercentage,
    platformFeeGst: roundMoney(grossPlatformMargin - platformFeeBeforeGst),
    customerPays: roundMoney(effectiveCustomerPrice),
    discountAmount: roundMoney(discountAmount),
    discountPercentage: listPrice > effectiveCustomerPrice ? roundMoney((discountAmount / listPrice) * 100) : 0,
    error: null,
  };
}
