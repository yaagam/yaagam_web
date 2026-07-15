import Redis from 'ioredis/built/Redis';
import { getRedisConnectionOptions } from './redis-connection.config';

export const redis: Redis = new Redis(getRedisConnectionOptions(process.env));
