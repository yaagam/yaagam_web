export interface ProviderOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}
export interface ProviderPlan {
  id: string;
  period: string;
  interval: number;
}
export interface ProviderSubscription {
  id: string;
  status: string;
  shortUrl?: string;
  chargeAt?: number;
}
export interface ProviderPayment {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}
export interface ProviderSettlementReconciliationItem {
  entityId: string;
  type: string;
  settlementId: string;
  amount: number;
  fee: number;
  tax: number;
  currency: string;
  settledAt?: number;
}
export interface ProviderSettlementReconciliationPage {
  items: ProviderSettlementReconciliationItem[];
  hasMore: boolean;
}
export interface ProviderSettlement {
  id: string;
  amount: number;
  status: string;
  fees: number;
  tax: number;
  utr?: string;
  createdAt: number;
}
export interface ProviderSettlementPage {
  items: ProviderSettlement[];
  hasMore: boolean;
}
export interface IPaymentProvider {
  createOrder(input: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }): Promise<ProviderOrder>;
  createPlan(input: {
    name: string;
    amount: number;
    currency: string;
    interval: number;
    notes: Record<string, string>;
  }): Promise<ProviderPlan>;
  createSubscription(input: {
    planId: string;
    totalCount: number;
    startAt?: number;
    upfront?: {
      name: string;
      amount: number;
      currency: string;
    };
    notes: Record<string, string>;
  }): Promise<ProviderSubscription>;
  fetchSubscription(id: string): Promise<ProviderSubscription>;
  pauseSubscription(id: string): Promise<void>;
  resumeSubscription(id: string): Promise<void>;
  cancelSubscription(id: string): Promise<void>;
  fetchPayment(id: string): Promise<ProviderPayment>;
  fetchSettlement(id: string): Promise<ProviderSettlement>;
  fetchSettlements(input: {
    from: number;
    to: number;
    skip: number;
    count: number;
  }): Promise<ProviderSettlementPage>;
  fetchSettlementReconciliation(input: {
    year: number;
    month: number;
    day: number;
    skip: number;
    count: number;
  }): Promise<ProviderSettlementReconciliationPage>;
  verifyPaymentSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}
