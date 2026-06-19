import { FileStorageService } from './file-storage.service';
import { DELETE_STORAGE_FILE_JOB } from './constants/storage-queue.const';

describe('FileStorageService', () => {
  function createService(storageQueue = { add: jest.fn() }) {
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          S3_SIGNED_URL_EXPIRES_SECONDS: '900',
          S3_ENDPOINT: 'http://localhost:9000',
          S3_FORCE_PATH_STYLE: 'true',
        };

        return config[key];
      }),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          S3_BUCKET_NAME: 'bucket',
          S3_REGION: 'us-east-1',
          S3_ACCESS_KEY_ID: 'access-key',
          S3_SECRET_ACCESS_KEY: 'secret-key',
        };

        return config[key];
      }),
    };

    return new FileStorageService(
      configService as never,
      storageQueue as never,
    );
  }

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
});
