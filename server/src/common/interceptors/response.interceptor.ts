import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  timestamp: string;
  version: string;
  path: string;
  data: T;
}

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  version: string;
  path: string;
  data: null;
}

@Injectable()
export default class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(
        (data: T): ApiResponse<T> => ({
          statusCode: response.statusCode,
          message: 'Success',
          timestamp: new Date().toISOString(),
          version: 'v1',
          path: request.originalUrl,
          data,
        }),
      ),

      catchError((err: unknown) => {
        let statusCode = 500;
        let message: string | string[] = 'Internal Server Error';
        let error = 'Error';

        if (err instanceof HttpException) {
          statusCode = err.getStatus();

          const exceptionResponse = err.getResponse();

          if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
          } else if (
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null
          ) {
            const responseObj = exceptionResponse as Record<string, unknown>;

            message =
              typeof responseObj.message === 'string' ||
              (Array.isArray(responseObj.message) &&
                responseObj.message.every(
                  (item): item is string => typeof item === 'string',
                ))
                ? responseObj.message
                : err.message;
          }

          error = err.name;
        }

        const errorResponse: ApiErrorResponse = {
          statusCode,
          message,
          error,
          timestamp: new Date().toISOString(),
          version: 'v1',
          path: request.originalUrl,
          data: null,
        };

        return throwError(() => new HttpException(errorResponse, statusCode));
      }),
    );
  }
}
