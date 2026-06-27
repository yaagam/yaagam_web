import type { UploadedStorageFile } from './uploaded-storage-file.interface';

export interface IFileStorageService {
  uploadFile(file: UploadedStorageFile, folder: string): Promise<string>;
  createSecureUrl(key?: string | null): Promise<string | null>;
  deleteFile(key: string): Promise<void>;
  queueDeleteFile(key: string): Promise<void>;
}
