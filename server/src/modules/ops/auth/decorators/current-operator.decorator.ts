import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OpsAuthenticatedRequest } from '../interfaces/ops-authenticated-request.interface';

export const CurrentOperator = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<OpsAuthenticatedRequest>();
    return request.operator;
  },
);
