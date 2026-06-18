import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { ServerResponse } from 'http';

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

export const loggerConfig = (configService: ConfigService) => ({
  pinoHttp: {
    customErrorMessage: (_req, res: ResponseWithErrorLocals, error) =>
      res.locals?.errorMessage ?? error.message,
    customErrorObject: (_req, res: ResponseWithErrorLocals, error) => ({
      err: {
        type: res.locals?.errorType ?? error.name,
        message: res.locals?.errorMessage ?? error.message,
        stack: res.locals?.errorStack ?? error.stack,
      },
    }),
    transport:
      configService.get('NODE_ENV') !== 'production'
        ? {
            target: 'pino-pretty',
          }
        : {
            target: 'pino/file',
            options: {
              destination: path.join(logsDir, 'app.log'),
            },
          },
  },
});
