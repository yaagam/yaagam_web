export type PaymentStatus =
  | "loading"
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "expired"
  | "cancelled"
  | "retrying"
  | "subscription_active"
  | "subscription_pending"
  | "subscription_cancelled";

export type PaymentKind = "single" | "subscription";

export type PaymentPriceBreakdown = {
  poojaUnitAmount?: number;
  devoteeCount?: number;
  poojaAmount: number;
  offerings: Array<{
    offeringId: string;
    nameSnapshot: string;
    quantity: number;
    total: number;
  }>;
  offeringTotal: number;
  dakshinaAmount: number;
  grandTotal: number;
  currency: "INR";
};

export type PaymentSession = {
  publicToken?: string;
  bookingId: string;
  transactionId: string;
  keyId?: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  expiresAt?: string;
  serverTime?: string;
  qrPayload?: string;
  qrImageUrl?: string;
  qrImageContent?: string;
  status?: PaymentStatus;
  kind?: PaymentKind;
  gatewayReference?: string;
  correlationId?: string;
  redirectUrl?: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  priceBreakdown: PaymentPriceBreakdown;
};

export type PaymentSnapshot = {
  status: PaymentStatus;
  expiresAt: string;
  serverTime: string;
  qrPayload?: string;
  qrImageUrl?: string;
  qrImageContent?: string;
  correlationId?: string;
  redirectUrl?: string;
  message?: string;
};

export type PaymentError = {
  code: "network" | "offline" | "invalid_response" | "server" | "unknown";
  message: string;
  retryable: boolean;
};
