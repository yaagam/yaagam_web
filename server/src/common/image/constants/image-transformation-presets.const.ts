import type { ImageTransformationOptions } from '../interfaces/image-service.interface';

export const IMAGE_TRANSFORMATION_PRESETS = {
  thumbnail: {
    width: 120,
    quality: 'auto',
    format: 'auto',
  },
  avatar: {
    width: 200,
    height: 200,
    quality: 'auto',
    format: 'auto',
    fit: 'cover',
    crop: 'face',
  },
  card: {
    width: 500,
    height: 350,
    quality: 'auto',
    format: 'auto',
    fit: 'cover',
    crop: 'center',
  },
  hero: {
    width: 1600,
    height: 900,
    quality: 'auto',
    format: 'auto',
    fit: 'cover',
    crop: 'center',
  },
  gallery: {
    width: 1200,
    quality: 'auto',
    format: 'auto',
    fit: 'contain',
  },
  banner: {
    width: 1600,
    height: 600,
    quality: 'auto',
    format: 'auto',
    fit: 'cover',
    crop: 'center',
  },
  blogCover: {
    width: 1200,
    height: 630,
    quality: 'auto',
    format: 'auto',
    fit: 'cover',
    crop: 'center',
  },
  original: {
    quality: 'auto',
    format: 'auto',
  },
} as const satisfies Record<string, ImageTransformationOptions>;
