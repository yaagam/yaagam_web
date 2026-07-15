import type { RedisOptions } from 'ioredis';

export interface IRedisEnvironment {
  REDIS_URL?: string;
  UPSTASH_REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string | number;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: string | number;
}

export interface IRedisConnectionOptions {
  maxRetriesPerRequest?: number | null;
}

function parseOptionalNumber(
  value: string | number | undefined,
): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export function getRedisConnectionOptions(
  env: IRedisEnvironment,
  options: IRedisConnectionOptions = {},
): RedisOptions {
  const redisUrl = env.REDIS_URL || env.UPSTASH_REDIS_URL;

  if (redisUrl) {
    const parsedUrl = new URL(redisUrl);

    return {
      host: parsedUrl.hostname,
      port: parseOptionalNumber(parsedUrl.port) ?? 6379,
      username: parsedUrl.username || undefined,
      password: parsedUrl.password
        ? decodeURIComponent(parsedUrl.password)
        : undefined,
      db: parsedUrl.pathname
        ? parseOptionalNumber(parsedUrl.pathname.replace('/', ''))
        : undefined,
      tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: options.maxRetriesPerRequest,
    };
  }

  return {
    host: env.REDIS_HOST || 'localhost',
    port: parseOptionalNumber(env.REDIS_PORT) ?? 6379,
    username: env.REDIS_USERNAME || undefined,
    password: env.REDIS_PASSWORD || undefined,
    db: parseOptionalNumber(env.REDIS_DB) ?? 0,
    maxRetriesPerRequest: options.maxRetriesPerRequest,
  };
}
