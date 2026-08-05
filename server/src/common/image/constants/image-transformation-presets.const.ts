import type { ImageTransformationOptions } from '../interfaces/image-service.interface';

export const IMAGE_TRANSFORMATION_PRESETS = {
  thumbnail: {
    width: 300,
    height: 300,
    quality: 80,
    format: 'webp',
    fit: 'cover',
    crop: 'center',
  },
  card: {
    width: 600,
    height: 400,
    quality: 80,
    format: 'webp',
    fit: 'cover',
    crop: 'center',
  },
  banner: {
    width: 1600,
    height: 900,
    quality: 90,
    format: 'webp',
    fit: 'cover',
    crop: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp',
    fit: 'cover',
    crop: 'face',
  },
  original: {
    format: 'auto',
  },
} as const satisfies Record<string, ImageTransformationOptions>;
