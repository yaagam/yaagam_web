import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import type { UploadedStorageFile } from './interfaces/uploaded-storage-file.interface';
import {
  DELETE_STORAGE_FILE_JOB,
  STORAGE_QUEUE,
  type DeleteStorageFileJobData,
} from './constants/storage-queue.const';

@Injectable()
export class FileStorageService {
  private readonly _s3Client: S3Client;
  private readonly _bucketName: string;
  private readonly _signedUrlExpiresInSeconds: number;

  constructor(
    private readonly _configService: ConfigService,
    @InjectQueue(STORAGE_QUEUE)
    private readonly _storageQueue: Queue<DeleteStorageFileJobData>,
  ) {
    this._bucketName = this._configService.getOrThrow<string>('S3_BUCKET_NAME');
    this._signedUrlExpiresInSeconds = Number(
      this._configService.get<string>('S3_SIGNED_URL_EXPIRES_SECONDS') ?? 900,
    );
    this._s3Client = new S3Client({
      region: this._configService.getOrThrow<string>('S3_REGION'),
      endpoint: this._configService.get<string>('S3_ENDPOINT') || undefined,
      forcePathStyle:
        this._configService.get<string>('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: this._configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this._configService.getOrThrow<string>(
          'S3_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async uploadFile(file: UploadedStorageFile, folder: string): Promise<string> {
    const key = this._createObjectKey(folder, file.originalname);

    await this._s3Client.send(
      new PutObjectCommand({
        Bucket: this._bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  async createSecureUrl(key?: string | null): Promise<string | null> {
    if (!key) {
      return null;
    }

    return getSignedUrl(
      this._s3Client,
      new GetObjectCommand({
        Bucket: this._bucketName,
        Key: key,
      }),
      { expiresIn: this._signedUrlExpiresInSeconds },
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this._s3Client.send(
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
        jobId: `${DELETE_STORAGE_FILE_JOB}:${key}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
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
}
