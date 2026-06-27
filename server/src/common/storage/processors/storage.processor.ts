import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { FILE_STORAGE_SERVICE } from '../constants/storage-service-token.const';
import {
  DELETE_STORAGE_FILE_JOB,
  STORAGE_QUEUE,
  type DeleteStorageFileJobData,
} from '../constants/storage-queue.const';
import type { IFileStorageService } from '../interfaces/file-storage.service.interface';

@Processor(STORAGE_QUEUE)
export class StorageProcessor extends WorkerHost {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: IFileStorageService,
  ) {
    super();
  }

  async process(job: Job<DeleteStorageFileJobData>): Promise<void> {
    if (job.name !== DELETE_STORAGE_FILE_JOB) {
      return;
    }

    await this._fileStorageService.deleteFile(job.data.key);
  }
}
