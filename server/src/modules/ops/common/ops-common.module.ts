import { Global, Module } from '@nestjs/common';
import { OpsPrivateImageInterceptor } from './ops-private-image.interceptor';
import { OPS_PRIVATE_IMAGE_SERIALIZER } from './ops-private-image-serializer-token.const';
import { OpsPrivateImageSerializer } from './ops-private-image-serializer.service';

@Global()
@Module({
  providers: [
    OpsPrivateImageSerializer,
    OpsPrivateImageInterceptor,
    {
      provide: OPS_PRIVATE_IMAGE_SERIALIZER,
      useExisting: OpsPrivateImageSerializer,
    },
  ],
  exports: [OpsPrivateImageInterceptor, OPS_PRIVATE_IMAGE_SERIALIZER],
})
export class OpsCommonModule {}
