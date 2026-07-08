import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { UsersService } from './users.service';

describe('UsersService', () => {
  function createService({
    prismaService = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
    otpService = {
      generate: jest.fn(),
      verify: jest.fn(),
    },
    otpQueue = {
      add: jest.fn(),
    },
  } = {}) {
    return new UsersService(
      prismaService as never,
      otpService as never,
      otpQueue as never,
    );
  }

  it('returns users', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = createService({ prismaService });

    await expect(service.getUsers()).resolves.toEqual([]);
    expect(prismaService.user.findMany).toHaveBeenCalled();
  });

  it('sends an OTP for a new WhatsApp number', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          whatsappNumber: '9876543210',
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    const otpService = {
      generate: jest
        .fn()
        .mockResolvedValue({ sessionId: 'session-id', otp: '123456' }),
      verify: jest.fn(),
    };
    const otpQueue = { add: jest.fn() };
    const service = createService({ prismaService, otpService, otpQueue });

    await expect(
      service.sendChangeWhatsappOtp('user-id', {
        whatsappNumber: '9876543211',
      }),
    ).resolves.toEqual({ sessionId: 'session-id' });
    expect(otpService.generate).toHaveBeenCalledWith({
      userId: JSON.stringify({
        userId: 'user-id',
        whatsappNumber: '9876543211',
      }),
    });
    expect(otpQueue.add).toHaveBeenCalledWith(
      'send-whatsapp-otp',
      { whatsappNumber: '9876543211', otp: '123456' },
      expect.objectContaining({ jobId: 'session-id' }),
    );
  });

  it('rejects an already linked WhatsApp number', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          whatsappNumber: '9876543210',
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    const service = createService({ prismaService });

    await expect(
      service.sendChangeWhatsappOtp('user-id', {
        whatsappNumber: '9876543210',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a WhatsApp number owned by another user', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          whatsappNumber: '9876543210',
        }),
        findFirst: jest.fn().mockResolvedValue({ id: 'other-user-id' }),
        update: jest.fn(),
      },
    };
    const service = createService({ prismaService });

    await expect(
      service.sendChangeWhatsappOtp('user-id', {
        whatsappNumber: '9876543211',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies OTP and updates the WhatsApp number', async () => {
    const prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          whatsappNumber: '9876543210',
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({
          id: 'user-id',
          whatsappNumber: '9876543211',
          isWhatsappVerified: true,
        }),
      },
    };
    const otpService = {
      generate: jest.fn(),
      verify: jest.fn().mockResolvedValue({
        userId: JSON.stringify({
          userId: 'user-id',
          whatsappNumber: '9876543211',
        }),
      }),
    };
    const service = createService({ prismaService, otpService });

    await expect(
      service.verifyChangeWhatsappOtp('user-id', {
        sessionId: 'session-id',
        otp: '123456',
      }),
    ).resolves.toEqual({
      userId: 'user-id',
      whatsappNumber: '9876543211',
      isWhatsappVerified: true,
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        whatsappNumber: '9876543211',
        isWhatsappVerified: true,
        provider: AuthProvider.WHATSAPP,
      },
      select: {
        id: true,
        whatsappNumber: true,
        isWhatsappVerified: true,
      },
    });
  });
});
