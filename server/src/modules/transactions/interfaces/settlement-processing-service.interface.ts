export interface ISettlementProcessingService {
  register(payload: Record<string, unknown>): Promise<void>;
  process(providerSettlementId: string): Promise<void>;
}
