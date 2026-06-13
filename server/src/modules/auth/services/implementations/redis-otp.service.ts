import { randomInt, randomUUID } from 'crypto';
import {
  GenerateOtpRequest,
  GenerateOtpResponse,
  IOtpService,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.service.inteface';
import bcrypt from 'bcryptjs';
import { redis } from 'src/config/redis/redis.config';
import { BadRequestException } from '@nestjs/common';
import {
  INVALID_SESSION,
  OTP_EXPIRED,
  TOO_MANY_ATTEMPTS,
  WAIT_BEFORE_RESEND,
} from '../../constants/errors.const';

interface OtpSession {
  userId: string;
  resendCount: number;
}

interface OtpData {
  hash: string;
  attempts: number;
}

export class RedisOtpService implements IOtpService {
  private readonly OTP_TTL = 300;
  private readonly SESSION_TTL = 900;
  private readonly COOLDOWN_TTL = 60;
  private readonly MAX_ATTEMPTS = 10;
  private readonly MAX_RESENDS = 5;

  private sessionKey(sessionId: string): string {
    return `otp:session:${sessionId}`;
  }

  private dataKey(sessionId: string): string {
    return `otp:data:${sessionId}`;
  }

  private cooldownKey(userId: string): string {
    return `otp:cooldown:${userId}`;
  }

  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  private parseJSON<T>(value: string | null): T {
    if (!value) {
      throw new BadRequestException(OTP_EXPIRED);
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      throw new BadRequestException(OTP_EXPIRED);
    }
  }

  async generate({ userId }: GenerateOtpRequest): Promise<GenerateOtpResponse> {
    const sessionId = randomUUID();
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp.toString(), 5);

    const session: OtpSession = {
      userId,
      resendCount: 0,
    };

    const data: OtpData = {
      hash,
      attempts: 0,
    };

    await redis.set(
      this.sessionKey(sessionId),
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL,
    );

    await redis.set(
      this.dataKey(sessionId),
      JSON.stringify(data),
      'EX',
      this.OTP_TTL,
    );

    return { sessionId, otp };
  }

  async verify({
    sessionId,
    otp,
  }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const sessionRaw = await redis.get(this.sessionKey(sessionId));
    const dataRaw = await redis.get(this.dataKey(sessionId));

    const session = this.parseJSON<OtpSession>(sessionRaw);

    if (!dataRaw) {
      throw new BadRequestException(OTP_EXPIRED);
    }

    const data = this.parseJSON<OtpData>(dataRaw);

    if (data.attempts >= this.MAX_ATTEMPTS) {
      await redis.del(this.dataKey(sessionId));
      throw new BadRequestException(TOO_MANY_ATTEMPTS);
    }

    const isValid = await bcrypt.compare(otp, data.hash);

    if (!isValid) {
      const ttl = await redis.ttl(this.dataKey(sessionId));

      const updatedData: OtpData = {
        hash: data.hash,
        attempts: data.attempts + 1,
      };

      await redis.set(
        this.dataKey(sessionId),
        JSON.stringify(updatedData),
        'EX',
        ttl > 0 ? ttl : this.OTP_TTL,
      );

      throw new BadRequestException(INVALID_SESSION);
    }

    await redis.del(this.dataKey(sessionId));
    await redis.del(this.sessionKey(sessionId));

    return { userId: session.userId };
  }

  async resend({ sessionId }: ResendOtpRequest): Promise<ResendOtpResponse> {
    const sessionRaw = await redis.get(this.sessionKey(sessionId));
    const session = this.parseJSON<OtpSession>(sessionRaw);

    if (session.resendCount >= this.MAX_RESENDS) {
      throw new BadRequestException(TOO_MANY_ATTEMPTS);
    }

    if (await redis.get(this.cooldownKey(session.userId))) {
      throw new BadRequestException(WAIT_BEFORE_RESEND);
    }

    await redis.set(
      this.cooldownKey(session.userId),
      '1',
      'EX',
      this.COOLDOWN_TTL,
    );

    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);

    const data: OtpData = {
      hash,
      attempts: 0,
    };

    const updatedSession: OtpSession = {
      ...session,
      resendCount: session.resendCount + 1,
    };

    await redis.set(
      this.dataKey(sessionId),
      JSON.stringify(data),
      'EX',
      this.OTP_TTL,
    );

    await redis.set(
      this.sessionKey(sessionId),
      JSON.stringify(updatedSession),
      'EX',
      this.SESSION_TTL,
    );

    return { otp, userId: session.userId };
  }
}
