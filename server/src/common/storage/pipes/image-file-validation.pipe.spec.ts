import { BadRequestException } from '@nestjs/common';
import { ImageFileValidationPipe } from './image-file-validation.pipe';
import type { UploadedStorageFile } from '../interfaces/uploaded-storage-file.interface';

describe('ImageFileValidationPipe', () => {
  const pipe = new ImageFileValidationPipe();

  function createFile(mimetype: string): UploadedStorageFile {
    return {
      buffer: Buffer.from('file'),
      mimetype,
      originalname: 'file',
    };
  }

  it('allows image files', () => {
    const file = createFile('image/png');

    expect(pipe.transform(file)).toBe(file);
  });

  it('allows empty optional uploads', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('rejects non-image files', () => {
    expect(() => pipe.transform(createFile('application/pdf'))).toThrow(
      BadRequestException,
    );
  });

  it('rejects non-image files inside arrays', () => {
    expect(() =>
      pipe.transform([createFile('image/jpeg'), createFile('text/plain')]),
    ).toThrow(BadRequestException);
  });
});
