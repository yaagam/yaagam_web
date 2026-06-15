import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type {
  IAuthService,
  SendOtpInput,
  SendOtpOutput,
  VerifyOtpInput,
  VerifyOtpOutput,
} from './interfaces/auth.service.interface';
import type { IOtpService } from './interfaces/otp.service.interface';
import type { ITokenService } from './interfaces/token.service.interface';
import { OTP_SERVICE, TOKEN_SERVICE } from '../constants/service-tokens.const';
import {
  OTP_QUEUE,
  SEND_OTP_JOB,
  type SendOtpJobData,
} from '../constants/otp-queue.const';
import PrismaService from '../../../prisma/prisma.service';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(OTP_SERVICE)
    private readonly otpService: IOtpService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @InjectQueue(OTP_QUEUE)
    private readonly otpQueue: Queue<SendOtpJobData>,
    private readonly prismaService: PrismaService,
  ) {}

  async sendOtp({ whatsappNumber }: SendOtpInput): Promise<SendOtpOutput> {
    const { sessionId, otp } = await this.otpService.generate({
      userId: whatsappNumber,
    });

    await this.otpQueue.add(
      SEND_OTP_JOB,
      { whatsappNumber, otp },
      {
        jobId: sessionId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { sessionId };
  }

  async verifyOtp({
    sessionId,
    otp,
  }: VerifyOtpInput): Promise<VerifyOtpOutput> {
    const { userId: whatsappNumber } = await this.otpService.verify({
      sessionId,
      otp,
    });
    const user = await this.prismaService.user.upsert({
      where: { whatsappNumber },
      update: { isWhatsappVerified: true },
      create: {
        whatsappNumber,
        isWhatsappVerified: true,
      },
      select: { id: true },
    });
    const tokens = await this.tokenService.generateTokenPair({
      userId: user.id,
    });

    return { userId: user.id, ...tokens };
  }
}
