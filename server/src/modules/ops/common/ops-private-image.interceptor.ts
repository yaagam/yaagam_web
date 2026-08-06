import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, type Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { OPS_PRIVATE_IMAGE_SERIALIZER } from './ops-private-image-serializer-token.const';
import type { IOpsPrivateImageSerializer } from './ops-private-image-serializer.interface';

@Injectable()
export class OpsPrivateImageInterceptor implements NestInterceptor {
  constructor(
    @Inject(OPS_PRIVATE_IMAGE_SERIALIZER)
    private readonly _serializer: IOpsPrivateImageSerializer,
  ) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        mergeMap((value: unknown) => from(this._serializer.serialize(value))),
      );
  }
}
