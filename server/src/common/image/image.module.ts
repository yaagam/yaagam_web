import { Global, Module } from '@nestjs/common';
import { IMAGE_SERVICE } from './constants/image-service-token.const';
import { ImageService } from './image.service';

@Global()
@Module({
  providers: [
    ImageService,
    { provide: IMAGE_SERVICE, useExisting: ImageService },
  ],
  exports: [IMAGE_SERVICE],
})
export class ImageModule {}
