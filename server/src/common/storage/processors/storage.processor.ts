import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { FileStorageService } from '../file-storage.service';
import {
  DELETE_STORAGE_FILE_JOB,
  STORAGE_QUEUE,
  type DeleteStorageFileJobData,
} from '../constants/storage-queue.const';

@Processor(STORAGE_QUEUE)
export class StorageProcessor extends WorkerHost {
  constructor(private readonly _fileStorageService: FileStorageService) {
    super();
  }

  async process(job: Job<DeleteStorageFileJobData>): Promise<void> {
    if (job.name !== DELETE_STORAGE_FILE_JOB) {
      return;
    }

    await this._fileStorageService.deleteFile(job.data.key);
  }
}
