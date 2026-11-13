import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// The production app (server/src/app.ts) as Railway runs it: the API also serves the built client
// from CLIENT_DIST_DIR, and quote files live in UPLOAD_DIR/b2b. Only the owner-checked
// GET /api/b2b/quotes/:id/file may return a stored file; no static path may reach one.
const MARKER = 'private quote file 7f3a';
let base: string;
let key: string;
let app: Express;

beforeAll(async () => {
  base = mkdtempSync(path.join(tmpdir(), 'solcacao-private-'));
  const clientDir = path.join(base, 'client');
  const uploadDir = path.join(base, 'uploads');
  mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
  writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><div id="root"></div>');
  mkdirSync(path.join(uploadDir, 'b2b'), { recursive: true });
  key = `${randomUUID()}.pdf`;
  writeFileSync(path.join(uploadDir, 'b2b', key), `%PDF-1.4\n% ${MARKER}\n%%EOF\n`);
  vi.stubEnv('CLIENT_DIST_DIR', clientDir);
  vi.stubEnv('UPLOAD_DIR', uploadDir);
  ({ app } = await import('../../server/src/app.js'));
});
afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(base, { recursive: true, force: true });
});

describe('private quote files in the production app', () => {
  it('serves the built client, so static serving is really switched on in this test', async () => {
    const page = await request(app).get('/en/wholesale/request').set('Accept', 'text/html');
    expect(page.status).toBe(200);
    expect(page.text).toContain('<div id="root">');
  });

  it('never returns a stored file from a static or guessed path', async () => {
    const id = key.replace(/\.pdf$/, '');
    const paths = [
      `/${key}`,
      `/b2b/${key}`,
      `/uploads/b2b/${key}`,
      `/storage/b2b/${key}`,
      `/server/storage/b2b/${key}`,
      `/data/uploads/b2b/${key}`,
      `/assets/${key}`,
      `/assets/..%2F..%2Fuploads%2Fb2b%2F${key}`,
      `/..%2Fuploads%2Fb2b%2F${key}`,
      `/%2e%2e/uploads/b2b/${key}`,
      `/api/b2b/${key}`,
      `/api/b2b/quotes/${id}/file`,
    ];
    for (const url of paths) {
      for (const accept of ['*/*', 'text/html', 'application/pdf']) {
        const response = await request(app).get(url).set('Accept', accept);
        expect([400, 401, 403, 404], `${url} (${accept})`).toContain(response.status);
        expect(response.headers['content-type'] ?? '', url).not.toMatch(/application\/pdf/);
        expect(response.text ?? '', url).not.toContain(MARKER);
      }
    }
  });
});
