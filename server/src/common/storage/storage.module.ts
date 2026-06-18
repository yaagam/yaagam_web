import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FileStorageService } from './file-storage.service';
import { STORAGE_QUEUE } from './constants/storage-queue.const';
import { StorageProcessor } from './processors/storage.processor';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: STORAGE_QUEUE })],
  providers: [FileStorageService, StorageProcessor],
  exports: [FileStorageService],
})
export class StorageModule {}
