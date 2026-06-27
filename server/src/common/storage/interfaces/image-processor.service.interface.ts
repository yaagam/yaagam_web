import type { UploadedStorageFile } from './uploaded-storage-file.interface';

export interface IImageProcessorService {
  processImage(file: UploadedStorageFile): Promise<UploadedStorageFile>;
}
