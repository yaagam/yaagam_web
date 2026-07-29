import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { redis } from '../../../../config/redis/redis.config';
import {
  INVALID_OTP,
  OTP_EXPIRED,
  OTP_RATE_LIMITED,
  OTP_VERIFICATION_IN_PROGRESS,
  TOO_MANY_ATTEMPTS,
  WAIT_BEFORE_RESEND,
} from '../../constants/errors.const';
import type {
  GenerateOtpRequest,
  GenerateOtpResponse,
  IOtpService,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.service.interface';

interface OtpSession {
  userId: string;
  rateLimitKey: string;
  createdAt: number;
}

interface OtpData {
  digest: string;
  attempts: number;
}

interface RateLimitResult {
  count: number;
  ttl: number;
}

@Injectable()
export class RedisOtpService implements IOtpService {
  private readonly _otpTtlSeconds: number;
  private readonly _sessionTtlSeconds: number;
  private readonly _cooldownSeconds: number;
  private readonly _maxVerificationAttempts: number;
  private readonly _hashSecret: string;

  constructor(private readonly _configService: ConfigService) {
    this._otpTtlSeconds = this._positiveInteger('OTP_TTL_SECONDS', 300);
    this._sessionTtlSeconds = this._positiveInteger(
      'OTP_SESSION_TTL_SECONDS',
      900,
    );
    this._cooldownSeconds = this._positiveInteger(
      'OTP_SEND_COOLDOWN_SECONDS',
      60,
    );
    this._maxVerificationAttempts = this._positiveInteger(
      'OTP_MAX_VERIFY_ATTEMPTS',
      5,
    );
    this._hashSecret = this._configService
      .getOrThrow<string>('OTP_HASH_SECRET')
      .trim();

    if (this._hashSecret.length < 32) {
      throw new Error('OTP_HASH_SECRET must contain at least 32 characters');
    }
  }

  async generate({
    userId,
    rateLimitId,
    ipAddress,
  }: GenerateOtpRequest): Promise<GenerateOtpResponse> {
    const userKey = this._identifierDigest(rateLimitId ?? userId);
    const ipKey = this._identifierDigest(ipAddress);

    await Promise.all([
      this._consumeRateLimit(`otp:limit:number:15m:${userKey}`, 3, 900),
      this._consumeRateLimit(`otp:limit:number:day:${userKey}`, 10, 86_400),
      this._consumeRateLimit(`otp:limit:ip:15m:${ipKey}`, 20, 900),
      this._consumeRateLimit(`otp:limit:ip:day:${ipKey}`, 100, 86_400),
    ]);

    const cooldownAcquired = await redis.set(
      this._cooldownKey(userKey),
      '1',
      'EX',
      this._cooldownSeconds,
      'NX',
    );
    if (!cooldownAcquired) {
      throw new HttpException(
        {
          message: WAIT_BEFORE_RESEND,
          retryAfterSeconds: await this._safeTtl(this._cooldownKey(userKey)),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const previousSessionId = await redis.get(this._activeSessionKey(userKey));
    if (previousSessionId) {
      await this.invalidate(previousSessionId);
    }

    const sessionId = randomUUID();
    const otp = this._generateOtp();
    const session: OtpSession = {
      userId,
      rateLimitKey: userKey,
      createdAt: Date.now(),
    };
    const data: OtpData = {
      digest: this._otpDigest(sessionId, otp),
      attempts: 0,
    };

    await redis
      .multi()
      .set(
        this._sessionKey(sessionId),
        JSON.stringify(session),
        'EX',
        this._sessionTtlSeconds,
      )
      .set(
        this._dataKey(sessionId),
        JSON.stringify(data),
        'EX',
        this._otpTtlSeconds,
      )
      .set(
        this._activeSessionKey(userKey),
        sessionId,
        'EX',
        this._sessionTtlSeconds,
      )
      .exec();

    return { sessionId, otp };
  }

  async verify({
    sessionId,
    otp,
    ipAddress,
  }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    await this._consumeRateLimit(
      `otp:limit:verify-ip:15m:${this._identifierDigest(ipAddress)}`,
      30,
      900,
    );

    const lockKey = this._verificationLockKey(sessionId);
    const lockToken = randomUUID();
    const lockAcquired = await redis.set(lockKey, lockToken, 'EX', 15, 'NX');
    if (!lockAcquired) {
      throw new BadRequestException(OTP_VERIFICATION_IN_PROGRESS);
    }

    try {
      const [sessionRaw, dataRaw] = await redis.mget(
        this._sessionKey(sessionId),
        this._dataKey(sessionId),
      );
      const session = this._parseJson<OtpSession>(sessionRaw);
      const data = this._parseJson<OtpData>(dataRaw);

      if (data.attempts >= this._maxVerificationAttempts) {
        await this.invalidate(sessionId);
        throw new HttpException(
          TOO_MANY_ATTEMPTS,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!this._isOtpMatch(sessionId, otp, data.digest)) {
        const attempts = data.attempts + 1;
        if (attempts >= this._maxVerificationAttempts) {
          await this.invalidate(sessionId);
          throw new HttpException(
            TOO_MANY_ATTEMPTS,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        const ttl = await this._safeTtl(this._dataKey(sessionId));
        await redis.set(
          this._dataKey(sessionId),
          JSON.stringify({ ...data, attempts }),
          'EX',
          ttl,
        );
        throw new BadRequestException(INVALID_OTP);
      }

      await this.invalidate(sessionId);
      return { userId: session.userId };
    } finally {
      await redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
        1,
        lockKey,
        lockToken,
      );
    }
  }

  async invalidate(sessionId: string): Promise<void> {
    const sessionRaw = await redis.get(this._sessionKey(sessionId));
    const session = this._tryParseJson<OtpSession>(sessionRaw);
    const keys = [this._sessionKey(sessionId), this._dataKey(sessionId)];

    if (session) {
      const activeKey = this._activeSessionKey(session.rateLimitKey);
      await redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
        1,
        activeKey,
        sessionId,
      );
    }

    await redis.del(...keys);
  }

  private _sessionKey(sessionId: string): string {
    return `otp:session:${sessionId}`;
  }

  private _dataKey(sessionId: string): string {
    return `otp:data:${sessionId}`;
  }

  private _activeSessionKey(userKey: string): string {
    return `otp:active:${userKey}`;
  }

  private _cooldownKey(userKey: string): string {
    return `otp:cooldown:${userKey}`;
  }

  private _verificationLockKey(sessionId: string): string {
    return `otp:verify-lock:${sessionId}`;
  }

  private _generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private _otpDigest(sessionId: string, otp: string): string {
    return createHmac('sha256', this._hashSecret)
      .update(`${sessionId}:${otp}`)
      .digest('hex');
  }

  private _identifierDigest(value: string): string {
    return createHmac('sha256', this._hashSecret)
      .update(value.trim().toLowerCase())
      .digest('hex');
  }

  private _isOtpMatch(
    sessionId: string,
    otp: string,
    storedDigest: string,
  ): boolean {
    if (!/^[a-f0-9]{64}$/i.test(storedDigest)) return false;
    const incoming = Buffer.from(this._otpDigest(sessionId, otp), 'hex');
    const stored = Buffer.from(storedDigest, 'hex');
    return (
      incoming.length === stored.length && timingSafeEqual(incoming, stored)
    );
  }

  private _parseJson<T>(value: string | null): T {
    const parsed = this._tryParseJson<T>(value);
    if (!parsed) throw new BadRequestException(OTP_EXPIRED);
    return parsed;
  }

  private _tryParseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private async _consumeRateLimit(
    key: string,
    maximum: number,
    windowSeconds: number,
  ): Promise<void> {
    const result = (await redis.eval(
      "local current=redis.call('INCR',KEYS[1]); if current==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return {current,redis.call('TTL',KEYS[1])}",
      1,
      key,
      windowSeconds,
    )) as [number, number];
    const limit: RateLimitResult = { count: result[0], ttl: result[1] };

    if (limit.count > maximum) {
      throw new HttpException(
        {
          message: OTP_RATE_LIMITED,
          retryAfterSeconds: Math.max(1, limit.ttl),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async _safeTtl(key: string): Promise<number> {
    return Math.max(1, await redis.ttl(key));
  }

  private _positiveInteger(key: string, fallback: number): number {
    const value = Number(this._configService.get<string>(key) ?? fallback);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
    return value;
  }
}
