import type { UploadedStorageFile } from './uploaded-storage-file.interface';

export interface IFileStorageService {
  uploadFile(
    file: UploadedStorageFile,
    folder: string,
    slug: string,
  ): Promise<string>;
  uploadAudio(
    file: UploadedStorageFile,
    folder: string,
    slug: string,
  ): Promise<string>;
  deleteFile(key: string): Promise<void>;
  queueDeleteFile(key: string): Promise<void>;
}
