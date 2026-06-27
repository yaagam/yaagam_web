import sharp from 'sharp';
import { SharpImageProcessorService } from './sharp-image-processor.service';

describe('SharpImageProcessorService', () => {
  const service = new SharpImageProcessorService();

  async function createImageBuffer(
    width: number,
    height: number,
  ): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
  }

  it('converts supported images to WebP and replaces the extension', async () => {
    const buffer = await createImageBuffer(100, 80);

    const result = await service.processImage({
      buffer,
      mimetype: 'image/png',
      originalname: 'Temple Image.PNG',
    });
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimetype).toBe('image/webp');
    expect(result.originalname).toBe('Temple Image.webp');
    expect(metadata.format).toBe('webp');
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.width).toBe(100);
  });

  it('resizes only images wider than 2000 pixels', async () => {
    const largeBuffer = await createImageBuffer(2400, 1200);
    const smallBuffer = await createImageBuffer(1600, 800);

    const largeResult = await service.processImage({
      buffer: largeBuffer,
      mimetype: 'image/png',
      originalname: 'large.png',
    });
    const smallResult = await service.processImage({
      buffer: smallBuffer,
      mimetype: 'image/png',
      originalname: 'small.png',
    });

    await expect(sharp(largeResult.buffer).metadata()).resolves.toMatchObject({
      width: 2000,
    });
    await expect(sharp(smallResult.buffer).metadata()).resolves.toMatchObject({
      width: 1600,
    });
  });
});
