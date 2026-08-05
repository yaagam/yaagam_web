import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { IMAGE_PROCESSOR_SERVICE } from './constants/image-processor-service-token.const';
import type { IFileStorageService } from './interfaces/file-storage.service.interface';
import type { IImageProcessorService } from './interfaces/image-processor.service.interface';
import type { UploadedStorageFile } from './interfaces/uploaded-storage-file.interface';
import {
  DELETE_STORAGE_FILE_JOB,
  STORAGE_QUEUE,
  type DeleteStorageFileJobData,
} from './constants/storage-queue.const';

@Injectable()
export class FileStorageService implements IFileStorageService {
  private readonly _r2Client: S3Client;
  private readonly _bucketName: string;

  constructor(
    private readonly _configService: ConfigService,
    @InjectQueue(STORAGE_QUEUE)
    private readonly _storageQueue: Queue<DeleteStorageFileJobData>,
    @Inject(IMAGE_PROCESSOR_SERVICE)
    private readonly _imageProcessorService: IImageProcessorService,
  ) {
    this._bucketName = this._configService.getOrThrow<string>('R2_BUCKET_NAME');
    this._r2Client = new S3Client({
      region: 'auto',
      endpoint: this._createR2Endpoint(),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this._configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this._configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async uploadFile(file: UploadedStorageFile, folder: string): Promise<string> {
    const processedFile = await this._imageProcessorService.processImage(file);
    const key = this._createObjectKey(folder, processedFile.originalname);

    await this._r2Client.send(
      new PutObjectCommand({
        Bucket: this._bucketName,
        Key: key,
        Body: processedFile.buffer,
        ContentType: processedFile.mimetype,
      }),
    );

    return key;
  }

  async deleteFile(key: string): Promise<void> {
    await this._r2Client.send(
      new DeleteObjectCommand({
        Bucket: this._bucketName,
        Key: key,
      }),
    );
  }

  async queueDeleteFile(key: string): Promise<void> {
    await this._storageQueue.add(
      DELETE_STORAGE_FILE_JOB,
      { key },
      {
        jobId: this._createDeleteFileJobId(key),
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  private _createR2Endpoint(): string {
    const configuredEndpoint = this._configService.get<string>('R2_ENDPOINT');

    if (configuredEndpoint) {
      return configuredEndpoint;
    }

    const accountId = this._configService.getOrThrow<string>('R2_ACCOUNT_ID');

    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  private _createObjectKey(folder: string, originalName: string): string {
    const safeFolder = folder.replace(/^\/+|\/+$/g, '');
    const safeName = originalName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safeFolder}/${randomUUID()}-${safeName || 'file'}`;
  }

  private _createDeleteFileJobId(key: string): string {
    return `${DELETE_STORAGE_FILE_JOB}-${encodeURIComponent(key)}`;
  }
}
