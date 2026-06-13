import Redis from 'ioredis/built/Redis';
import type { RedisOptions } from 'ioredis/built/redis/RedisOptions';

const redisOptions: RedisOptions = {
  host: 'localhost',
  port: 6379,
};

export const redis: Redis = new Redis(redisOptions);
