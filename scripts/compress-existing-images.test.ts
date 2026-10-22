import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { compressToTarget } from './compress-existing-images.mjs';

describe('existing storage image compression', () => {
  it('keeps large JPEGs within the configured size and dimensions', async () => {
    const width = 900;
    const height = 600;
    const pixels = Buffer.alloc(width * height * 3);
    let seed = 123456789;
    for (let index = 0; index < pixels.length; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      pixels[index] = seed >>> 24;
    }

    const original = await sharp(pixels, {
      raw: { width, height, channels: 3 },
    }).jpeg({ quality: 100 }).toBuffer();
    const result = await compressToTarget(original, { maxDimension: 1600, maxSizeKb: 100 });
    const outputMetadata = await sharp(result.buffer).metadata();

    expect(result.buffer.length).toBeLessThanOrEqual(100 * 1024);
    expect(outputMetadata.format).toBe('jpeg');
    expect(Math.max(outputMetadata.width || 0, outputMetadata.height || 0)).toBeLessThanOrEqual(1600);
  }, 15000);

  it('returns valid PNG output for images smaller than 640 pixels', async () => {
    const original = await sharp({
      create: { width: 320, height: 240, channels: 4, background: '#336699' },
    }).png().toBuffer();
    const result = await compressToTarget(original, { maxDimension: 1600, maxSizeKb: 0.01 });
    const outputMetadata = await sharp(result.buffer).metadata();

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(outputMetadata.format).toBe('png');
    expect(outputMetadata.width).toBe(320);
    expect(outputMetadata.height).toBe(240);
  });
});