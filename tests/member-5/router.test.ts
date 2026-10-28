import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createSupportRouter } from '../../server/src/features/support/router.js';
import { SupportError } from '../../server/src/features/support/errors.js';
import { input, product } from './fixtures.js';
import { once } from 'node:events';
import { createHttpSupport } from '../../client/src/features/support/http.js';
import { createHttpClient } from '../../client/src/api/http.js';

function appWith(options: Parameters<typeof createSupportRouter>[0] = {}) {
  const app = express();
  app.use('/api', createSupportRouter({ isDatabaseReady: () => true, ...options }));
  return app;
}

describe('POST /api/inquiries', () => {
  it('round trips the HTTP adapter through the common transport and real Express endpoint', async () => {
    const receipt = {
      id: product.id,
      status: 'received' as const,
      notificationStatus: 'failed' as const,
    };
    const app = appWith({ submit: async () => receipt });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No test HTTP port');
    const nativeFetch = globalThis.fetch;
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((path, options) =>
        nativeFetch(`http://127.0.0.1:${address.port}${String(path)}`, options),
      );
    try {
      const adapter = createHttpSupport(createHttpClient(() => null));
      expect(await adapter.submit(input)).toEqual(receipt);
      await expect(adapter.submit({ ...input, message: 'bad' })).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    } finally {
      fetchSpy.mockRestore();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
  it('returns a received receipt even when its notification failed', async () => {
    const receipt = {
      id: product.id,
      status: 'received' as const,
      notificationStatus: 'failed' as const,
    };
    const submit = vi.fn(async () => receipt);
    const response = await request(appWith({ submit })).post('/api/inquiries').send(input);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: receipt });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(submit).toHaveBeenCalledWith(input);
  });

  it('rejects malformed fields and injected operators without calling persistence', async () => {
    const submit = vi.fn();
    const app = appWith({ submit });
    for (const bad of [
      { ...input, email: { $ne: null } },
      { ...input, message: 'bad' },
      { ...input, from: 'fake@example.test' },
    ]) {
      const response = await request(app).post('/api/inquiries').send(bad);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(submit).not.toHaveBeenCalled();
  });

  it('returns safe outage, conflict and unexpected error envelopes', async () => {
    const outage = await request(appWith({ isDatabaseReady: () => false }))
      .post('/api/inquiries')
      .send(input);
    expect(outage.status).toBe(503);
    for (const error of [
      new SupportError(409, 'IDEMPOTENCY_CONFLICT', 'Request changed'),
      new Error('secret database internals'),
    ]) {
      const response = await request(
        appWith({
          submit: async () => {
            throw error;
          },
        }),
      )
        .post('/api/inquiries')
        .send(input);
      expect(response.status).toBe(error instanceof SupportError ? 409 : 500);
      expect(JSON.stringify(response.body)).not.toContain('secret');
    }
  });

  it('enforces JSON, body size, parsing and public rate limit', async () => {
    const submit = vi.fn(async () => ({
      id: product.id,
      status: 'received' as const,
      notificationStatus: 'sent' as const,
    }));
    const app = appWith({ submit });
    expect((await request(app).post('/api/inquiries').type('text').send('hello')).status).toBe(415);
    expect(
      (await request(app).post('/api/inquiries').set('Content-Type', 'application/json').send('{'))
        .status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/inquiries')
          .send({ ...input, message: 'a'.repeat(17000) })
      ).status,
    ).toBe(413);
    const limited = appWith({ submit, rateLimitMax: 1 });
    expect((await request(limited).post('/api/inquiries').send(input)).status).toBe(201);
    const response = await request(limited).post('/api/inquiries').send(input);
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});
