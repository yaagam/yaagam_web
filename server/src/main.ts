import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import GlobalExceptionsFilter from './common/filters/global-exceptions.filter';
import ResponseInterceptor from './common/interceptors/response.interceptor';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //global prefix
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');

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
  app.useGlobalInterceptors(new ResponseInterceptor());

  //logger
  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
