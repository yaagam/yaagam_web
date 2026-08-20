/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { S3Client } from '@aws-sdk/client-s3';
import { FileStorageService } from './file-storage.service';
import { DELETE_STORAGE_FILE_JOB } from './constants/storage-queue.const';

describe('FileStorageService', () => {
  const imageProcessorService = {
    processImage: jest.fn().mockImplementation(async (file) => file),
  };

  function createService(storageQueue = { add: jest.fn() }) {
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          R2_ENDPOINT: 'http://localhost:9000',
        };

        return config[key];
      }),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          R2_BUCKET_NAME: 'bucket',
          R2_ACCOUNT_ID: 'account-id',
          R2_ACCESS_KEY_ID: 'access-key',
          R2_SECRET_ACCESS_KEY: 'secret-key',
        };

        return config[key];
      }),
    };

    return new FileStorageService(
      configService as never,
      storageQueue as never,
      imageProcessorService,
    );
  }

  beforeEach(() => {
    imageProcessorService.processImage.mockReset();
    imageProcessorService.processImage.mockImplementation(async (file) => file);
  });

  it('uploads processed WebP files to R2 and returns a WebP key', async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const webpBuffer = Buffer.from('webp');
    imageProcessorService.processImage.mockResolvedValue({
      buffer: webpBuffer,
      mimetype: 'image/webp',
      originalname: 'temple.webp',
    });
    const service = createService();

    const key = await service.uploadFile(
      {
        buffer: Buffer.from('jpeg'),
        mimetype: 'image/jpeg',
        originalname: 'temple.jpg',
      },
      'temples',
      'meenakshi-amman-temple',
    );

    expect(key).toMatch(/^temples\/meenakshi-amman-temple\/[0-9a-f-]+\.webp$/);
    expect(key).not.toContain('temple.jpg');
    expect(imageProcessorService.processImage).toHaveBeenCalledWith({
      buffer: Buffer.from('jpeg'),
      mimetype: 'image/jpeg',
      originalname: 'temple.jpg',
    });
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket',
          Key: key,
          Body: webpBuffer,
          ContentType: 'image/webp',
        }),
      }),
    );

    sendSpy.mockRestore();
  });

  it('queues file deletion with a BullMQ-safe custom job ID', async () => {
    const storageQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService(storageQueue);

    await service.queueDeleteFile('temples/image:with-colon.jpg');

    expect(storageQueue.add).toHaveBeenCalledWith(
      DELETE_STORAGE_FILE_JOB,
      { key: 'temples/image:with-colon.jpg' },
      expect.objectContaining({
        jobId: 'delete-storage-file-temples%2Fimage%3Awith-colon.jpg',
      }),
    );
  });

  it('uploads original MP3 audio to R2 without image processing', async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const service = createService();
    const buffer = Buffer.from('ID3audio');

    const key = await service.uploadAudio(
      {
        buffer,
        mimetype: 'audio/mpeg',
        originalname: 'mantra.mp3',
      },
      'poojas/mantras',
      'ganapathi-homam',
    );

    expect(key).toMatch(
      /^poojas\/mantras\/ganapathi-homam\/[0-9a-f-]+\.mp3$/,
    );
    expect(imageProcessorService.processImage).not.toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bucket',
          Key: key,
          Body: buffer,
          ContentType: 'audio/mpeg',
        }),
      }),
    );
    sendSpy.mockRestore();
  });
});
