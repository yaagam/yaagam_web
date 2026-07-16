import { getRedisConnectionOptions } from './redis-connection.config';

describe('getRedisConnectionOptions', () => {
  it('uses local Redis settings in development even when Upstash is configured', () => {
    const options = getRedisConnectionOptions({
      NODE_ENV: 'development',
      UPSTASH_REDIS_URL: 'rediss://default:secret@example.upstash.io:6379',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_DB: '0',
    });

    expect(options).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 6379,
        db: 0,
      }),
    );
    expect(options.tls).toBeUndefined();
  });

  it('uses Upstash Redis in production', () => {
    const options = getRedisConnectionOptions({
      NODE_ENV: 'production',
      UPSTASH_REDIS_URL: 'rediss://default:secret@example.upstash.io:6380/2',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    });

    expect(options).toEqual(
      expect.objectContaining({
        host: 'example.upstash.io',
        port: 6380,
        username: 'default',
        password: 'secret',
        db: 2,
        tls: {},
      }),
    );
  });
});
