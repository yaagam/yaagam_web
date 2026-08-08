export const PLATFORM_FEE_PERCENT = 40;
export const PLATFORM_FEE_GST_PERCENT = 18;

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function getMarketplacePricing(templeAmount: string | number) {
  const parsedAmount = Number(templeAmount);
  const baseAmount =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const platformFee = roundMoney((baseAmount * PLATFORM_FEE_PERCENT) / 100);
  const platformFeeGst = roundMoney(
    (platformFee * PLATFORM_FEE_GST_PERCENT) / 100,
  );

  return {
    baseAmount: roundMoney(baseAmount),
    platformFee,
    platformFeeGst,
    customerTotal: roundMoney(baseAmount + platformFee + platformFeeGst),
  };
}
