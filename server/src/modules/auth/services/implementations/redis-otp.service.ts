import { randomInt, randomUUID } from 'crypto';
import {
  GenerateOtpRequest,
  GenerateOtpResponse,
  IOtpService,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.service.interface';
import bcrypt from 'bcryptjs';
import { redis } from '../../../../config/redis/redis.config';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  INVALID_OTP,
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

@Injectable()
export class RedisOtpService implements IOtpService {
  private readonly _OTP_TTL = 300;
  private readonly _SESSION_TTL = 900;
  private readonly _COOLDOWN_TTL = 60;
  private readonly _MAX_ATTEMPTS = 10;
  private readonly _MAX_RESENDS = 5;

  private _sessionKey(sessionId: string): string {
    return `otp:session:${sessionId}`;
  }

  private _dataKey(sessionId: string): string {
    return `otp:data:${sessionId}`;
  }

  private _cooldownKey(userId: string): string {
    return `otp:cooldown:${userId}`;
  }

  private _generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  private _parseJSON<T>(value: string | null): T {
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
    const otp = this._generateOtp();
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
      this._sessionKey(sessionId),
      JSON.stringify(session),
      'EX',
      this._SESSION_TTL,
    );

    await redis.set(
      this._dataKey(sessionId),
      JSON.stringify(data),
      'EX',
      this._OTP_TTL,
    );

    return { sessionId, otp };
  }

  async verify({
    sessionId,
    otp,
  }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const sessionRaw = await redis.get(this._sessionKey(sessionId));
    const dataRaw = await redis.get(this._dataKey(sessionId));

    const session = this._parseJSON<OtpSession>(sessionRaw);

    if (!dataRaw) {
      throw new BadRequestException(OTP_EXPIRED);
    }

    const data = this._parseJSON<OtpData>(dataRaw);

    if (data.attempts >= this._MAX_ATTEMPTS) {
      await redis.del(this._dataKey(sessionId));
      throw new BadRequestException(TOO_MANY_ATTEMPTS);
    }

    const isValid = await bcrypt.compare(otp, data.hash);

    if (!isValid) {
      const ttl = await redis.ttl(this._dataKey(sessionId));

      const updatedData: OtpData = {
        hash: data.hash,
        attempts: data.attempts + 1,
      };

      await redis.set(
        this._dataKey(sessionId),
        JSON.stringify(updatedData),
        'EX',
        ttl > 0 ? ttl : this._OTP_TTL,
      );

      throw new BadRequestException(INVALID_OTP);
    }

    await redis.del(this._dataKey(sessionId));
    await redis.del(this._sessionKey(sessionId));

    return { userId: session.userId };
  }

  async resend({ sessionId }: ResendOtpRequest): Promise<ResendOtpResponse> {
    const sessionRaw = await redis.get(this._sessionKey(sessionId));
    const session = this._parseJSON<OtpSession>(sessionRaw);

    if (session.resendCount >= this._MAX_RESENDS) {
      throw new BadRequestException(TOO_MANY_ATTEMPTS);
    }

    if (await redis.get(this._cooldownKey(session.userId))) {
      throw new BadRequestException(WAIT_BEFORE_RESEND);
    }

    await redis.set(
      this._cooldownKey(session.userId),
      '1',
      'EX',
      this._COOLDOWN_TTL,
    );

    const otp = this._generateOtp();
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
      this._dataKey(sessionId),
      JSON.stringify(data),
      'EX',
      this._OTP_TTL,
    );

    await redis.set(
      this._sessionKey(sessionId),
      JSON.stringify(updatedSession),
      'EX',
      this._SESSION_TTL,
    );

    return { otp, userId: session.userId };
  }
}
