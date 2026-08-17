import { loggerConfig } from './logger.config';
import * as path from 'path';

describe('loggerConfig', () => {
  it('rotates application and error logs daily', () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'LOG_TO_FILE' ? 'true' : null)),
    };
    const config = loggerConfig(configService as never);
    const target = (file: string, level: string) => ({
      target: 'pino-roll',
      level,
      options: {
        file: path.join(process.cwd(), 'logs', file),
        frequency: 'daily',
        dateFormat: 'yyyy-MM-dd',
        mkdir: true,
        limit: { count: 6 },
      },
    });
    expect(config.pinoHttp.transport).toEqual({
      targets: [target('app.log', 'info'), target('error.log', 'error')],
    });
  });

  it('keeps stdout logging when file logging is disabled', () => {
    const configService = { get: jest.fn().mockReturnValue('false') };
    const config = loggerConfig(configService as never);
    expect(config.pinoHttp.transport).toEqual({ target: 'pino-pretty' });
  });

  it('uses warn for client failures and error for server failures', () => {
    const config = loggerConfig({
      get: jest.fn().mockReturnValue('false'),
    } as never);
    expect(
      config.pinoHttp.customLogLevel({} as never, { statusCode: 400 } as never),
    ).toBe('warn');
    expect(
      config.pinoHttp.customLogLevel({} as never, { statusCode: 500 } as never),
    ).toBe('error');
  });
});
