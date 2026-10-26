import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { photos, productPhotos } from '../../client/src/shared/photos.js';

const PUBLIC = 'client/public';
const BUDGET_LARGE = 160 * 1024;
const BUDGET_SMALL = 80 * 1024;
const BUDGET_PRODUCT = 120 * 1024;

/** Reads width/height from a WebP header (lossy VP8, lossless VP8L or extended VP8X). */
function webpSize(file: string) {
  const buf = readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP')
    throw new Error(`${file} is not a WebP file`);
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ')
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X')
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  throw new Error(`${file}: unknown WebP chunk ${chunk}`);
}

const entries = Object.entries(photos);

describe('site photo library', () => {
  it.each(entries)('%s points at real files whose sizes match the manifest', (_name, photo) => {
    const candidates = photo.srcSet.split(',').map((part) => {
      const [url, descriptor] = part.trim().split(' ');
      return { url, width: Number(descriptor.replace('w', '')) };
    });
    expect(candidates.map((c) => c.url)).toContain(photo.src);
    for (const { url, width } of candidates) {
      const file = path.join(PUBLIC, url);
      expect(existsSync(file), file).toBe(true);
      const size = webpSize(file);
      expect(size.width, url).toBe(width);
      const isLargest = url === photo.src;
      if (isLargest) expect(size.height, url).toBe(photo.height);
      expect(statSync(file).size, url).toBeLessThanOrEqual(isLargest ? BUDGET_LARGE : BUDGET_SMALL);
    }
    expect(photo.width).toBe(Math.max(...candidates.map((c) => c.width)));
  });

  it.each(entries)(
    '%s has distinct, non-empty EN and ES alt text and a focal point',
    (_name, photo) => {
      expect(photo.alt.en.trim().length).toBeGreaterThan(5);
      expect(photo.alt.es.trim().length).toBeGreaterThan(5);
      expect(photo.alt.es).not.toBe(photo.alt.en);
      expect(photo.position).toMatch(/^\d{1,3}% \d{1,3}%$/);
    },
  );

  it('ships no unreferenced files in client/public/images', () => {
    const referenced = new Set(
      entries.flatMap(([, photo]) =>
        photo.srcSet.split(',').map((part) => path.basename(part.trim().split(' ')[0])),
      ),
    );
    const files = readdirSync(path.join(PUBLIC, 'images'), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    expect(files.filter((file) => !referenced.has(file))).toEqual([]);
  });
});

const products = Object.entries(productPhotos);

describe('product photo pool', () => {
  it.each(products)('%s is a square WebP within budget with EN and ES alt text', (_name, image) => {
    const file = path.join(PUBLIC, image.url);
    expect(existsSync(file), file).toBe(true);
    const size = webpSize(file);
    expect(size.width).toBe(size.height);
    expect(size.width).toBeGreaterThanOrEqual(600);
    expect(statSync(file).size).toBeLessThanOrEqual(BUDGET_PRODUCT);
    expect(image.alt.en.trim().length).toBeGreaterThan(5);
    expect(image.alt.es.trim().length).toBeGreaterThan(5);
    expect(image.alt.es).not.toBe(image.alt.en);
  });

  it('ships no unreferenced files in client/public/images/products', () => {
    const referenced = new Set(products.map(([, image]) => path.basename(image.url)));
    expect(
      readdirSync(path.join(PUBLIC, 'images', 'products')).filter((file) => !referenced.has(file)),
    ).toEqual([]);
  });
});
