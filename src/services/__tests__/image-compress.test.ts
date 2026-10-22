import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from '../storage';

describe('compressImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns original files for unsupported image types', async () => {
    const file = new File(['test'], 'note.txt', { type: 'text/plain' });

    await expect(compressImage(file)).resolves.toBe(file);
  });

  it('resizes large images to jpeg before upload', async () => {
    const file = new File(['binary'], 'sample.png', { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);

    const drawImage = vi.fn();
    const toBlob = vi.fn((callback) => {
      callback(new Blob(['compressed-image'], { type: 'image/jpeg' }));
    });

    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return canvasMock;
      }
      return originalCreateElement(tagName);
    });

    const originalImage = globalThis.Image;
    class FakeImage {
      width = 4000;
      height = 3000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    // @ts-expect-error test replacement for browser Image constructor
    globalThis.Image = FakeImage;

    try {
      const result = await compressImage(file, 1200, 0.7);

      expect(result.type).toBe('image/jpeg');
      expect(result.name).toBe('sample.jpg');
      expect(drawImage).toHaveBeenCalled();
      expect(toBlob).toHaveBeenCalled();
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it('reduces image quality until it reaches the requested size', async () => {
    const file = new File(['binary'], 'sample.png', { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);
    const toBlob = vi.fn((callback, _type, quality) => {
      const size = quality > 0.6 ? 250 * 1024 : 150 * 1024;
      callback(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
    });
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return canvasMock;
      return originalCreateElement(tagName);
    });

    const originalImage = globalThis.Image;
    class FakeImage {
      width = 1200;
      height = 900;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    // @ts-expect-error test replacement for browser Image constructor
    globalThis.Image = FakeImage;

    try {
      const result = await compressImage(file, 1600, 0.72, 200 * 1024);

      expect(result.size).toBeLessThanOrEqual(200 * 1024);
      expect(toBlob).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.Image = originalImage;
    }
  });
});
