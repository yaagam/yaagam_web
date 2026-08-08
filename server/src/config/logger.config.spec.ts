import { loggerConfig } from './logger.config';
import * as path from 'path';

describe('loggerConfig', () => {
  it('rotates file logs daily and retains seven rotated files by default', () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'LOG_TO_FILE' ? 'true' : null)),
    };

    const config = loggerConfig(configService as never);

    expect(config.pinoHttp.transport).toEqual({
      target: 'pino-roll',
      options: {
        file: path.join(process.cwd(), 'logs', 'app.log'),
        frequency: 'daily',
        dateFormat: 'yyyy-MM-dd',
        mkdir: true,
        limit: { count: 6 },
      },
    });
  });

  it('keeps stdout logging when file logging is disabled', () => {
    const configService = {
      get: jest.fn().mockReturnValue('false'),
    };

    const config = loggerConfig(configService as never);

    expect(config.pinoHttp.transport).toEqual({ target: 'pino-pretty' });
  });
});
