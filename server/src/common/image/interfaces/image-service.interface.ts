export type ImageFormat = 'auto' | 'webp' | 'avif';
export type ImageCrop = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'face';
export type ImageFit = 'cover' | 'contain' | 'fill';

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  crop?: ImageCrop;
  fit?: ImageFit;
  blur?: number;
}

export interface IImageService {
  getPublicUrl(imageKey?: string | null): string | null;
  getTransformedUrl(
    imageKey: string | null | undefined,
    options: ImageTransformationOptions,
  ): string | null;
  getThumbnail(imageKey?: string | null): string | null;
  getCardImage(imageKey?: string | null): string | null;
  getBannerImage(imageKey?: string | null): string | null;
  getAvatar(imageKey?: string | null): string | null;
  getOriginal(imageKey?: string | null): string | null;
}
