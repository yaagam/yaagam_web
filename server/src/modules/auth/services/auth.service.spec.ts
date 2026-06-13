import { AuthService } from './auth.service';
import { SEND_OTP_JOB } from './otp-queue.constants';

describe('AuthService', () => {
  it('generates an OTP and queues its delivery', async () => {
    const otpService = {
      generate: jest.fn().mockResolvedValue({
        sessionId: 'session-id',
        otp: '123456',
      }),
      verify: jest.fn(),
      resend: jest.fn(),
    };
    const otpQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(otpService, otpQueue as never);

    await expect(
      service.sendOtp({ whatsappNumber: '8157988287' }),
    ).resolves.toEqual({ sessionId: 'session-id' });
    expect(otpService.generate).toHaveBeenCalledWith({
      userId: '8157988287',
    });
    expect(otpQueue.add).toHaveBeenCalledWith(
      SEND_OTP_JOB,
      { whatsappNumber: '8157988287', otp: '123456' },
      expect.objectContaining({ jobId: 'session-id', attempts: 3 }),
    );
  });
});
