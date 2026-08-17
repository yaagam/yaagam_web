import { PaymentProcessor } from './payment.processor';
import { PROCESS_SETTLEMENT_JOB } from '../constants/payment.const';

describe('PaymentProcessor', () => {
  it('dispatches settlement jobs to the settlement service', async () => {
    const settlements = { process: jest.fn().mockResolvedValue(undefined) };
    const processor = new PaymentProcessor(
      { process: jest.fn() } as never,
      { reconcileBatch: jest.fn() },
      settlements as never,
    );

    await processor.process({
      name: PROCESS_SETTLEMENT_JOB,
      data: { providerSettlementId: 'setl_123' },
    } as never);

    expect(settlements.process).toHaveBeenCalledWith('setl_123');
  });
});
