import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
};

@Catch()
export default class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal Server Error';
    let details: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        details = exceptionResponse as Record<string, unknown>;
      }

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message =
          (
            exceptionResponse as {
              message?: string | string[];
            }
          ).message ?? exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorLike = this._toErrorLike(exception);

    response.locals['errorType'] =
      typeof errorLike.name === 'string' ? errorLike.name : 'UnknownException';
    response.locals['errorMessage'] = Array.isArray(message)
      ? message.join(', ')
      : message;
    response.locals['errorStack'] =
      typeof errorLike.stack === 'string' ? errorLike.stack : undefined;

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      version: 'v1',
      path: request.originalUrl,
      data: null,
      ...details,
      message,
    });
  }

  private _toErrorLike(exception: unknown): ErrorLike {
    return typeof exception === 'object' && exception !== null ? exception : {};
  }
}
