import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMAGE_TRANSFORMATION_PRESETS } from './constants/image-transformation-presets.const';
import type {
  IImageService,
  ImageCrop,
  ImageFit,
  ImageTransformationOptions,
} from './interfaces/image-service.interface';

const FIT_TRANSFORMATIONS: Record<ImageFit, string> = {
  cover: 'c-maintain_ratio',
  contain: 'c-at_max',
  fill: 'c-force',
};

const CROP_TRANSFORMATIONS: Record<ImageCrop, string> = {
  center: 'fo-center',
  top: 'fo-top',
  bottom: 'fo-bottom',
  left: 'fo-left',
  right: 'fo-right',
  face: 'fo-face',
};

@Injectable()
export class ImageService implements IImageService {
  private readonly _urlEndpoint: string;

  constructor(private readonly _configService: ConfigService) {
    this._urlEndpoint = this._normalizeEndpoint(
      this._configService.getOrThrow<string>('IMAGEKIT_URL_ENDPOINT'),
    );
  }

  getPublicUrl(imageKey?: string | null): string | null {
    const normalizedKey = this._normalizeKey(imageKey);
    return normalizedKey ? `${this._urlEndpoint}/${normalizedKey}` : null;
  }

  getStorageKey(imageUrl: string): string | null {
    let source: URL;
    let endpoint: URL;
    try {
      source = new URL(imageUrl);
      endpoint = new URL(this._urlEndpoint);
    } catch {
      return null;
    }
    const endpointPath = endpoint.pathname.replace(/\/+$/g, '');
    if (
      source.origin !== endpoint.origin ||
      !source.pathname.startsWith(`${endpointPath}/`)
    ) {
      return null;
    }
    const path = source.pathname
      .slice(endpointPath.length)
      .replace(/^\/+/, '')
      .replace(/^tr:[^/]+\//, '');
    if (!path) return null;
    try {
      return path
        .split('/')
        .map((segment) => decodeURIComponent(segment))
        .join('/');
    } catch {
      return null;
    }
  }
  getTransformedUrl(
    imageKey: string | null | undefined,
    options: ImageTransformationOptions,
  ): string | null {
    const normalizedKey = this._normalizeKey(imageKey);
    if (!normalizedKey) return null;

    const transformations = this._buildTransformations(options);
    if (!transformations.length) return this.getPublicUrl(normalizedKey);

    return `${this._urlEndpoint}/tr:${transformations.join(',')}/${normalizedKey}`;
  }

  getThumbnail(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.thumbnail,
    );
  }

  getCardImage(imageKey?: string | null): string | null {
    return this.getTransformedUrl(imageKey, IMAGE_TRANSFORMATION_PRESETS.card);
  }

  getHeroImage(imageKey?: string | null): string | null {
    return this.getTransformedUrl(imageKey, IMAGE_TRANSFORMATION_PRESETS.hero);
  }

  getGalleryImage(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.gallery,
    );
  }
  getBannerImage(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.banner,
    );
  }

  getBlogCover(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.blogCover,
    );
  }
  getAvatar(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.avatar,
    );
  }

  getOriginal(imageKey?: string | null): string | null {
    return this.getTransformedUrl(
      imageKey,
      IMAGE_TRANSFORMATION_PRESETS.original,
    );
  }

  private _buildTransformations(options: ImageTransformationOptions): string[] {
    const transformations: string[] = [];
    this._appendIntegerTransformation(transformations, 'w', options.width, 1);
    this._appendIntegerTransformation(transformations, 'h', options.height, 1);
    this._appendQualityTransformation(transformations, options.quality);
    if (options.format) transformations.push(`f-${options.format}`);
    if (options.fit) transformations.push(FIT_TRANSFORMATIONS[options.fit]);
    if (options.crop) transformations.push(CROP_TRANSFORMATIONS[options.crop]);
    this._appendIntegerTransformation(
      transformations,
      'bl',
      options.blur,
      1,
      100,
    );
    return transformations;
  }

  private _appendQualityTransformation(
    transformations: string[],
    quality: ImageTransformationOptions['quality'],
  ): void {
    if (quality === undefined) return;
    if (quality === 'auto') {
      transformations.push('q-auto');
      return;
    }
    this._appendIntegerTransformation(transformations, 'q', quality, 1, 100);
  }
  private _appendIntegerTransformation(
    transformations: string[],
    name: string,
    value: number | undefined,
    minimum: number,
    maximum = 10_000,
  ): void {
    if (value === undefined) return;
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new RangeError(
        `${name} must be an integer between ${minimum} and ${maximum}`,
      );
    }
    transformations.push(`${name}-${value}`);
  }

  private _normalizeEndpoint(endpoint: string): string {
    const normalized = endpoint.trim().replace(/\/+$/g, '');
    if (!/^https:\/\//i.test(normalized)) {
      throw new Error('IMAGEKIT_URL_ENDPOINT must be an HTTPS URL');
    }
    return normalized;
  }

  private _normalizeKey(imageKey?: string | null): string | null {
    const normalized = imageKey?.trim().replace(/^\/+|\/+$/g, '');
    if (!normalized) return null;
    return normalized
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}
