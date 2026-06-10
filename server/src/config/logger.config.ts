import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

fs.mkdirSync(logsDir, {
  recursive: true,
});

export const loggerConfig = (configService: ConfigService) => ({
  pinoHttp: {
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
