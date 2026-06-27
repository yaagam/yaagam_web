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

  it.each(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])(
    'allows %s files',
    (mimetype) => {
      const file = createFile(mimetype);

      expect(pipe.transform(file)).toBe(file);
    },
  );

  it('allows empty optional uploads', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it.each(['application/pdf', 'image/gif', 'image/svg+xml', 'text/plain'])(
    'rejects %s files',
    (mimetype) => {
      expect(() => pipe.transform(createFile(mimetype))).toThrow(
        BadRequestException,
      );
    },
  );

  it('rejects unsupported files inside arrays', () => {
    expect(() =>
      pipe.transform([createFile('image/jpeg'), createFile('text/plain')]),
    ).toThrow(BadRequestException);
  });
});
