import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClientRouter } from '../../server/src/features/shell/client.js';
import { errorHandler, notFoundHandler } from '../../server/src/shared/errors.js';

const html = '<!doctype html><title>SolCacao</title><div id="root"></div>';
let base: string;
let clientDir: string;
let uploadDir: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), 'solcacao-client-'));
  clientDir = path.join(base, 'client');
  uploadDir = path.join(base, 'storage');
  mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
  mkdirSync(uploadDir);
  writeFileSync(path.join(clientDir, 'index.html'), html);
  writeFileSync(path.join(clientDir, 'assets', 'index-abc123.js'), 'console.log(1)');
  writeFileSync(path.join(clientDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  writeFileSync(path.join(uploadDir, 'quote.pdf'), '%PDF-1.4');
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

/** Same order as server/src/app.ts: API routers, then the client, then the JSON 404. */
function appFor(root = clientDir) {
  const app = express();
  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.use(createClientRouter({ root, privateDirs: [uploadDir] }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('production client serving', () => {
  it.each([
    '/',
    '/en',
    '/es/',
    '/en/catalog',
    '/es/products/peru-85-dark-bar',
    '/en/wholesale/request',
  ])('serves the app for the deep link %s so a refresh works', async (url) => {
    const response = await request(appFor()).get(url).set('Accept', 'text/html');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.text).toContain('<div id="root">');
  });

  it('serves the app with a 404 status outside the two locales', async () => {
    const response = await request(appFor()).get('/fr/catalog').set('Accept', 'text/html');
    expect(response.status).toBe(404);
    expect(response.text).toContain('<div id="root">');
  });

  it('keeps API routes and the JSON 404 for unknown API paths', async () => {
    const app = appFor();
    expect((await request(app).get('/api/health')).body).toEqual({ data: { status: 'ok' } });
    const missing = await request(app).get('/api/nope').set('Accept', 'text/html');
    expect(missing.status).toBe(404);
    expect(missing.headers['content-type']).toContain('application/json');
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('caches hashed assets for a year and other files briefly', async () => {
    const app = appFor();
    const asset = await request(app).get('/assets/index-abc123.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['cache-control']).toContain('max-age=31536000');
    expect(asset.headers['cache-control']).toContain('immutable');
    const icon = await request(app).get('/favicon.svg');
    expect(icon.status).toBe(200);
    expect(icon.headers['cache-control']).toContain('max-age=3600');
  });

  it('answers a missing file with the JSON 404, not the app page', async () => {
    const response = await request(appFor()).get('/assets/index-old999.js').set('Accept', '*/*');
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
  });

  it('does not serve the app for writes or non-HTML requests', async () => {
    const app = appFor();
    expect((await request(app).post('/en/catalog').set('Accept', 'text/html')).status).toBe(404);
    const json = await request(app).get('/en/catalog').set('Accept', 'application/json');
    expect(json.status).toBe(404);
    expect(json.headers['content-type']).toContain('application/json');
  });

  it('refuses to start without a built client or when it overlaps private uploads', () => {
    expect(() => createClientRouter({ root: path.join(base, 'missing') })).toThrow(/npm run build/);
    expect(() => createClientRouter({ root: clientDir, privateDirs: [clientDir] })).toThrow(
      /overlaps private directory/,
    );
    expect(() =>
      createClientRouter({ root: clientDir, privateDirs: [path.join(clientDir, 'uploads')] }),
    ).toThrow(/overlaps private directory/);
  });
});
