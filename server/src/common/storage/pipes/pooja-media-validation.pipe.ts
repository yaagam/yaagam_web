import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { UploadedStorageFile } from '../interfaces/uploaded-storage-file.interface';

const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export interface UploadedPoojaMedia {
  images?: UploadedStorageFile[];
  mantraAudio?: UploadedStorageFile[];
}

@Injectable()
export class PoojaMediaValidationPipe implements PipeTransform {
  transform(value: UploadedPoojaMedia | undefined): UploadedPoojaMedia {
    const media = value ?? {};
    for (const image of media.images ?? []) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(image.mimetype.toLowerCase())) {
        throw new BadRequestException(
          'Only jpg, jpeg, png, and webp images are allowed',
        );
      }
    }
    const audioFiles = media.mantraAudio ?? [];
    if (audioFiles.length > 1) {
      throw new BadRequestException('Only one mantra audio file is allowed');
    }
    if (audioFiles[0]) this._validateAudio(audioFiles[0]);
    return media;
  }

  private _validateAudio(file: UploadedStorageFile): void {
    const mimeType = file.mimetype.toLowerCase();
    if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Only MP3, M4A, and OGG audio is allowed');
    }
    if (file.buffer.length > MAX_AUDIO_SIZE_BYTES) {
      throw new BadRequestException('Mantra audio cannot exceed 20 MB');
    }
    if (!this._matchesAudioSignature(file.buffer, mimeType)) {
      throw new BadRequestException('Mantra audio content is invalid');
    }
  }

  private _matchesAudioSignature(buffer: Buffer, mimeType: string): boolean {
    if (mimeType === 'audio/ogg') {
      return buffer.subarray(0, 4).toString('ascii') === 'OggS';
    }
    if (mimeType === 'audio/mp4') {
      return (
        buffer.length >= 12 &&
        buffer.subarray(4, 8).toString('ascii') === 'ftyp'
      );
    }
    return (
      buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
      (buffer.length >= 2 &&
        buffer[0] === 0xff &&
        (buffer[1] & 0xe0) === 0xe0)
    );
  }
}
