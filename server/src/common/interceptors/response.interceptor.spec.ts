import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import ResponseInterceptor from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('preserves validation message arrays', async () => {
    const interceptor = new ResponseInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ originalUrl: '/api/auth/send-otp' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext;
    const next: CallHandler = {
      handle: (): Observable<never> =>
        throwError(
          () =>
            new BadRequestException({
              message: ['Invalid Number'],
              error: 'Bad Request',
              statusCode: 400,
            }),
        ),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: ['Invalid Number'],
        data: null,
      },
    });
  });
});
