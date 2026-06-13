import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    sendOtp: jest.fn().mockResolvedValue({ sessionId: 'session-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queues an OTP for the supplied WhatsApp number', async () => {
    await expect(
      controller.sendOtp({ whatsappNumber: '8157988287' }),
    ).resolves.toEqual({ sessionId: 'session-id' });
    expect(authService.sendOtp).toHaveBeenCalledWith({
      whatsappNumber: '8157988287',
    });
  });
});
