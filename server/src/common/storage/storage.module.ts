import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FileStorageService } from './file-storage.service';
import { IMAGE_PROCESSOR_SERVICE } from './constants/image-processor-service-token.const';
import { FILE_STORAGE_SERVICE } from './constants/storage-service-token.const';
import { STORAGE_QUEUE } from './constants/storage-queue.const';
import { StorageProcessor } from './processors/storage.processor';
import { SharpImageProcessorService } from './services/sharp-image-processor.service';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: STORAGE_QUEUE })],
  providers: [
    SharpImageProcessorService,
    {
      provide: IMAGE_PROCESSOR_SERVICE,
      useExisting: SharpImageProcessorService,
    },
    FileStorageService,
    {
      provide: FILE_STORAGE_SERVICE,
      useExisting: FileStorageService,
    },
    StorageProcessor,
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class StorageModule {}
