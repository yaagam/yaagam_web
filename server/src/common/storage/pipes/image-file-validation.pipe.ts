import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { UploadedStorageFile } from '../interfaces/uploaded-storage-file.interface';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

type UploadedImageInput =
  | UploadedStorageFile
  | UploadedStorageFile[]
  | undefined;

@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  transform(value: UploadedImageInput): UploadedImageInput {
    const files = Array.isArray(value) ? value : value ? [value] : [];

    files.forEach((file) => this._validateImageFile(file));

    return value;
  }

  private _validateImageFile(file: UploadedStorageFile): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        'Only jpg, jpeg, png, and webp files are allowed',
      );
    }
  }
}
