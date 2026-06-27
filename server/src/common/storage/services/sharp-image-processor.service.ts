import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import type { UploadedStorageFile } from '../interfaces/uploaded-storage-file.interface';
import type { IImageProcessorService } from '../interfaces/image-processor.service.interface';

const MAX_IMAGE_WIDTH = 2_000;
const WEBP_QUALITY = 82;
const WEBP_EFFORT = 4;

@Injectable()
export class SharpImageProcessorService implements IImageProcessorService {
  async processImage(file: UploadedStorageFile): Promise<UploadedStorageFile> {
    const image = sharp(file.buffer, { failOn: 'error' }).rotate();
    const metadata = await image.metadata();
    const pipeline =
      metadata.width && metadata.width > MAX_IMAGE_WIDTH
        ? image.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        : image;
    const buffer = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
      .toBuffer();

    return {
      ...file,
      buffer,
      mimetype: 'image/webp',
      originalname: this._replaceExtensionWithWebp(file.originalname),
    };
  }

  private _replaceExtensionWithWebp(originalName: string): string {
    const trimmedName = originalName.trim();
    const nameWithoutExtension = trimmedName.replace(/\.[^.\\/]*$/, '');

    return `${nameWithoutExtension || 'file'}.webp`;
  }
}
