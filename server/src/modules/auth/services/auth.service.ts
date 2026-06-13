import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type {
  IAuthService,
  SendOtpInput,
  SendOtpOutput,
} from './auth.service.interface';
import type { IOtpService } from './interfaces/otp.service.inteface';
import { OTP_SERVICE } from './tokens.service';
import { OTP_QUEUE, SEND_OTP_JOB } from './otp-queue.constants';
import type { SendOtpJobData } from './otp-queue.constants';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(OTP_SERVICE)
    private readonly otpService: IOtpService,
    @InjectQueue(OTP_QUEUE)
    private readonly otpQueue: Queue<SendOtpJobData>,
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
}
