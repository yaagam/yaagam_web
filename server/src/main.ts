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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  //global prefix
  const apiPrefix = (process.env.API_PREFIX ?? 'api').replace(/^\/+|\/+$/g, '');
  app.setGlobalPrefix(apiPrefix);

  //cors
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
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
