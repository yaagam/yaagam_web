import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import {
  MESSAGE_SERVICE,
  OTP_SERVICE,
} from '../auth/constants/service-tokens.const';
import type { IMessageService } from '../auth/services/interfaces/message.service.interface';
import type { IOtpService } from '../auth/services/interfaces/otp.service.interface';
import PrismaService from '../../prisma/prisma.service';
import type { SendChangeWhatsappOtpDto } from './dtos/send-change-whatsapp-otp.dto';
import type { VerifyChangeWhatsappOtpDto } from './dtos/verify-change-whatsapp-otp.dto';
import type {
  ChangedWhatsappNumber,
  ChangeWhatsappOtpSession,
  IUserService,
} from './users.service.interface';

interface ChangeWhatsappOtpPayload {
  userId: string;
  whatsappNumber: string;
}

@Injectable()
export class UsersService implements IUserService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(OTP_SERVICE)
    private readonly _otpService: IOtpService,
    @Inject(MESSAGE_SERVICE)
    private readonly _messageService: IMessageService,
  ) {}

  getUsers(): Promise<unknown[]> {
    return this._prismaService.user.findMany();
  }

  async sendChangeWhatsappOtp(
    userId: string,
    { whatsappNumber }: SendChangeWhatsappOtpDto,
    ipAddress = 'unknown',
  ): Promise<ChangeWhatsappOtpSession> {
    await this._ensureUserCanUseWhatsappNumber(userId, whatsappNumber);

    const { sessionId, otp } = await this._otpService.generate({
      userId: this._createChangeWhatsappOtpPayload(userId, whatsappNumber),
      rateLimitId: whatsappNumber,
      ipAddress,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('otp', otp);
    }

    try {
      await this._messageService.sendOtpMessage({ whatsappNumber, otp });
    } catch (error) {
      await this._otpService.invalidate(sessionId);
      throw error;
    }

    return { sessionId };
  }

  async verifyChangeWhatsappOtp(
    userId: string,
    { sessionId, otp }: VerifyChangeWhatsappOtpDto,
    ipAddress = 'unknown',
  ): Promise<ChangedWhatsappNumber> {
    const verified = await this._otpService.verify({
      sessionId,
      otp,
      ipAddress,
    });
    const payload = this._parseChangeWhatsappOtpPayload(verified.userId);

    if (payload.userId !== userId) {
      throw new BadRequestException('Invalid WhatsApp change session');
    }

    await this._ensureUserCanUseWhatsappNumber(userId, payload.whatsappNumber);

    const user = await this._prismaService.user.update({
      where: { id: userId },
      data: {
        whatsappNumber: payload.whatsappNumber,
        isWhatsappVerified: true,
        provider: AuthProvider.WHATSAPP,
      },
      select: {
        id: true,
        whatsappNumber: true,
        isWhatsappVerified: true,
      },
    });

    return {
      userId: user.id,
      whatsappNumber: user.whatsappNumber ?? payload.whatsappNumber,
      isWhatsappVerified: user.isWhatsappVerified,
    };
  }

  private async _ensureUserCanUseWhatsappNumber(
    userId: string,
    whatsappNumber: string,
  ): Promise<void> {
    const [currentUser, whatsappOwner] = await Promise.all([
      this._prismaService.user.findUnique({
        where: { id: userId },
        select: { id: true, whatsappNumber: true },
      }),
      this._prismaService.user.findFirst({
        where: { whatsappNumber },
        select: { id: true },
      }),
    ]);

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.whatsappNumber === whatsappNumber) {
      throw new BadRequestException(
        'WhatsApp number is already linked to this account',
      );
    }

    if (whatsappOwner && whatsappOwner.id !== userId) {
      throw new ConflictException('WhatsApp number is already in use');
    }
  }

  private _createChangeWhatsappOtpPayload(
    userId: string,
    whatsappNumber: string,
  ): string {
    return JSON.stringify({ userId, whatsappNumber });
  }

  private _parseChangeWhatsappOtpPayload(
    value: string,
  ): ChangeWhatsappOtpPayload {
    try {
      const payload = JSON.parse(value) as Partial<ChangeWhatsappOtpPayload>;

      if (
        typeof payload.userId !== 'string' ||
        typeof payload.whatsappNumber !== 'string'
      ) {
        throw new Error('Invalid payload');
      }

      return {
        userId: payload.userId,
        whatsappNumber: payload.whatsappNumber,
      };
    } catch {
      throw new BadRequestException('Invalid WhatsApp change session');
    }
  }
}
