import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { IMessageService } from './interfaces/message.service.interface';
import { MESSAGE_SERVICE } from './tokens.service';
import { OTP_QUEUE, SEND_OTP_JOB } from './otp-queue.constants';
import type { SendOtpJobData } from './otp-queue.constants';

@Processor(OTP_QUEUE)
export class OtpProcessor extends WorkerHost {
  constructor(
    @Inject(MESSAGE_SERVICE)
    private readonly messageService: IMessageService,
  ) {
    super();
  }

  async process(job: Job<SendOtpJobData>): Promise<void> {
    if (job.name !== SEND_OTP_JOB) {
      return;
    }

    await this.messageService.sendOtpMessage(job.data);
  }
}
