import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decarators/success-message.decarator';

interface ApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  timestamp: string;
  version: string;
  path: string;
  data: T;
}

@Injectable()
export default class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly _reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const message =
      this._reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ||
      'Request Successful';

    return next.handle().pipe(
      map(
        (data: T): ApiResponse<T> => ({
          statusCode: response.statusCode,
          status: 'Success',
          message: message,
          timestamp: new Date().toISOString(),
          version: 'v1',
          path: request.originalUrl,
          data,
        }),
      ),
    );
  }
}
