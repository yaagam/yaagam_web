import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

fs.mkdirSync(logsDir, {
  recursive: true,
});

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
            target: 'pino/file',
            options: {
              destination: path.join(logsDir, 'app.log'),
            },
          }
        : {
            target: 'pino-pretty',
          },
  },
});
