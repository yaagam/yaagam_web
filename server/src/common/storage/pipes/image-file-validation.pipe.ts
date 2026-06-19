import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { UploadedStorageFile } from '../interfaces/uploaded-storage-file.interface';

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
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
  }
}
