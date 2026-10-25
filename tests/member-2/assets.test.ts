import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPublicAssetsRouter } from '../../server/src/features/shell/assets.js';

const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
let base: string;
let publicDir: string;
let uploadDir: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), 'solcacao-assets-'));
  publicDir = path.join(base, 'public');
  uploadDir = path.join(base, 'storage');
  mkdirSync(publicDir);
  mkdirSync(uploadDir);
  writeFileSync(path.join(publicDir, 'bar.svg'), svg);
  writeFileSync(path.join(publicDir, 'notes.html'), '<script>alert(1)</script>');
  writeFileSync(path.join(publicDir, '.hidden.svg'), svg);
  writeFileSync(path.join(uploadDir, 'secret.svg'), svg);
  writeFileSync(path.join(uploadDir, 'brand.pdf'), '%PDF-1.4');
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

function appFor(root: string) {
  const app = express();
  app.use('/placeholders', createPublicAssetsRouter({ root, privateDirs: [uploadDir] }));
  return app;
}

describe('public asset router template', () => {
  it('serves approved image files with nosniff', async () => {
    const response = await request(appFor(publicDir)).get('/placeholders/bar.svg');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it.each([
    ['/placeholders/notes.html', 'non-allowlisted type'],
    ['/placeholders/.hidden.svg', 'dotfile'],
    ['/placeholders/missing.svg', 'missing file'],
    ['/placeholders/', 'directory listing'],
    ['/placeholders/..%2fstorage%2fsecret.svg', 'encoded traversal into uploads'],
    ['/placeholders/..%5cstorage%5csecret.svg', 'backslash traversal into uploads'],
    ['/placeholders/..%2fstorage%2fbrand.pdf', 'private PDF upload'],
  ])('returns JSON 404 for %s (%s)', async (url) => {
    const response = await request(appFor(publicDir)).get(url);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
  });

  it('refuses a public root that contains or sits inside the private upload directory', () => {
    expect(() => createPublicAssetsRouter({ root: base, privateDirs: [uploadDir] })).toThrow(
      /overlaps private directory/,
    );
    expect(() => createPublicAssetsRouter({ root: uploadDir, privateDirs: [uploadDir] })).toThrow(
      /overlaps private directory/,
    );
    expect(() =>
      createPublicAssetsRouter({ root: path.join(uploadDir, 'nested'), privateDirs: [uploadDir] }),
    ).toThrow(/overlaps private directory/);
  });
});
