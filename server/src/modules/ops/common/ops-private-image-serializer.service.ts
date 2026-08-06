import { Inject, Injectable } from '@nestjs/common';
import { IMAGE_SERVICE } from '../../../common/image/constants/image-service-token.const';
import type { IImageService } from '../../../common/image/interfaces/image-service.interface';
import { PRIVATE_IMAGE_DELIVERY_SERVICE } from '../../../common/storage/constants/private-image-delivery-service-token.const';
import type { IPrivateImageDeliveryService } from '../../../common/storage/interfaces/private-image-delivery.service.interface';
import type { IOpsPrivateImageSerializer } from './ops-private-image-serializer.interface';

@Injectable()
export class OpsPrivateImageSerializer implements IOpsPrivateImageSerializer {
  constructor(
    @Inject(IMAGE_SERVICE)
    private readonly _imageService: IImageService,
    @Inject(PRIVATE_IMAGE_DELIVERY_SERVICE)
    private readonly _privateImageDeliveryService: IPrivateImageDeliveryService,
  ) {}

  async serialize<T>(value: T): Promise<T> {
    return (await this._serializeValue(value)) as T;
  }

  private async _serializeValue(value: unknown): Promise<unknown> {
    if (typeof value === 'string') {
      const imageKey = this._imageService.getStorageKey(value);
      return imageKey
        ? await this._privateImageDeliveryService.getSignedUrl(imageKey)
        : value;
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this._serializeValue(item)));
    }
    if (!value || typeof value !== 'object' || value instanceof Date) {
      return value;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) return value;
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, item]) => [
        key,
        await this._serializeValue(item),
      ]),
    );
    return Object.fromEntries(entries);
  }
}
