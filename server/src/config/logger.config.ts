import { ConfigService } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
const DEFAULT_FILE_LOG_RETENTION_DAYS = 7;

type ResponseWithErrorLocals = ServerResponse & {
  locals?: {
    errorType?: string;
    errorMessage?: string;
    errorStack?: string;
  };
};

type RequestLogInput = IncomingMessage & {
  method?: string;
  url?: string;
};

export const loggerConfig = (configService: ConfigService) => ({
  pinoHttp: {
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        "req.headers['x-yaagam-proxy-secret']",
        "req.headers['set-cookie']",
        "res.headers['set-cookie']",
      ],
      censor: '[Redacted]',
    },
    autoLogging: true,
    customReceivedMessage: (req: RequestLogInput) =>
      `request received: ${req.method ?? ''} ${req.url ?? ''}`,
    customSuccessMessage: (
      req: RequestLogInput,
      res: ResponseWithErrorLocals,
    ) =>
      `request completed: ${req.method ?? ''} ${req.url ?? ''} ${res.statusCode}`,
    customErrorMessage: (
      _req: RequestLogInput,
      res: ResponseWithErrorLocals,
      error: Error,
    ) => res.locals?.errorMessage ?? error.message,
    customErrorObject: (
      _req: RequestLogInput,
      res: ResponseWithErrorLocals,
      error: Error,
    ) => ({
      err: {
        type: res.locals?.errorType ?? error.name,
        message: res.locals?.errorMessage ?? error.message,
        stack: res.locals?.errorStack ?? error.stack,
      },
    }),
    transport:
      configService.get<string>('LOG_TO_FILE') === 'true'
        ? {
            target: 'pino-roll',
            options: {
              file: path.join(logsDir, 'app.log'),
              frequency: 'daily',
              dateFormat: 'yyyy-MM-dd',
              mkdir: true,
              limit: {
                count: getRotatedFileLimit(configService),
              },
            },
          }
        : {
            target: 'pino-pretty',
          },
  },
});

const getRotatedFileLimit = (configService: ConfigService): number => {
  const configuredDays = Number(
    configService.get<string>('FILE_LOG_RETENTION_DAYS'),
  );
  const retentionDays =
    Number.isInteger(configuredDays) && configuredDays > 0
      ? configuredDays
      : DEFAULT_FILE_LOG_RETENTION_DAYS;

  // pino-roll excludes the active file from count.
  return Math.max(retentionDays - 1, 0);
};
