import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import GlobalExceptionsFilter from './common/filters/global-exceptions.filter';
import ResponseInterceptor from './common/interceptors/response.interceptor';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { dirname } from 'path';

function normalizeCorsOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/g, '');
}

function getAllowedCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map(normalizeCorsOrigin)
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.set('trust proxy', 1);
  app.use(cookieParser());

  //global prefix
  const apiPrefix = (process.env.API_PREFIX ?? 'api').replace(/^\/+|\/+$/g, '');
  app.setGlobalPrefix(apiPrefix);

  //cors
  const allowedCorsOrigins = getAllowedCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(null, allowedCorsOrigins.includes(normalizeCorsOrigin(origin)));
    },
    credentials: true,
  });

  //Gloabal Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionsFilter());

  //Global Interceptor
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Yaagam API')
    .setDescription('REST API documentation for the Yaagam backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerUiAssetsPath = dirname(
    require.resolve('swagger-ui-dist/package.json'),
  );

  app.use(
    `/${apiPrefix}/docs`,
    express.static(swaggerUiAssetsPath, { index: false }),
  );
  SwaggerModule.setup('docs', app, swaggerDocument, { useGlobalPrefix: true });
  //logger
  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
