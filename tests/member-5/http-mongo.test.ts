import { randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createHttpClient } from '../../client/src/api/http.js';
import { createHttpSupport } from '../../client/src/features/support/http.js';
import { InquiryModel } from '../../server/src/features/support/model.js';
import { connectDb, disconnectDb } from '../../server/src/shared/db.js';
import type { Product } from '../../contracts/index.js';
import { input } from './fixtures.js';
import { isolatedMongoUri, seedTestCatalog } from './integration-db.js';
import { decodedMail, startSmtpSink } from './smtp-sink.js';

const rawUri = process.env.TEST_MONGODB_URI;
describe.skipIf(!rawUri)('real app + MongoDB + local SMTP integration', () => {
  let server: Server;
  let origin: string;
  let sink: Awaited<ReturnType<typeof startSmtpSink>>;
  let connected = false;
  let products: Product[];
  let uploadDir: string;
  beforeAll(async () => {
    const uri = isolatedMongoUri(rawUri ?? '', 'http');
    sink = await startSmtpSink();
    uploadDir = await mkdtemp(join(tmpdir(), 'solcacao-member5-quotes-'));
    for (const [key, value] of Object.entries({
      JWT_SECRET: randomBytes(48).toString('base64url'),
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(sink.port),
      SMTP_SECURE: 'false',
      MAIL_FROM: 'demo@example.test',
      SUPPORT_EMAIL: 'support@example.test',
      UPLOAD_DIR: uploadDir,
    }))
      vi.stubEnv(key, value);
    await seedTestCatalog(uri);
    await connectDb(uri);
    connected = true;
    const { app } = await import('../../server/src/app.js');
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No HTTP test port');
    origin = `http://127.0.0.1:${address.port}`;
    vi.stubEnv('VITE_API_BASE_URL', `${origin}/api`);
    const response = await fetch(`${origin}/api/products?limit=48`);
    expect(response.status).toBe(200);
    products = await response.json();
    expect(products.length).toBeGreaterThan(1);
  }, 90000);

  afterAll(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    if (sink) await sink.stop();
    if (connected) {
      await mongoose.connection.dropDatabase();
      await disconnectDb();
    }
    vi.unstubAllEnvs();
    if (uploadDir) await rm(uploadDir, { recursive: true, force: true });
  });

  it.each(['en', 'es'] as const)(
    'saves six trusted pieces and captures one localized mail despite concurrent/lost-response retries in %s',
    async (locale) => {
      const adapter = createHttpSupport(createHttpClient(() => null));
      const sampler = {
        ...input,
        locale,
        category: 'sampler' as const,
        requestId: randomUUID(),
        samplerItems: products
          .slice(0, 2)
          .map((product) => ({ productId: product.id, quantity: 3 })),
      };
      const before = sink.messages.length;
      const receipts = await Promise.all([adapter.submit(sampler), adapter.submit(sampler)]);
      const replay = await adapter.submit(sampler); // Treat the first response as lost.
      expect(new Set([...receipts, replay].map((receipt) => receipt.id)).size).toBe(1);
      expect(replay.notificationStatus).toBe('sent');
      expect(await InquiryModel.countDocuments({ requestId: sampler.requestId })).toBe(1);
      const record = await InquiryModel.findOne({ requestId: sampler.requestId }).lean();
      expect(record?.status).toBe('received');
      expect(record?.samplerItems).toHaveLength(2);
      for (const product of products.slice(0, 2)) {
        expect(
          record?.samplerItems?.find((item) => item.productId.toString() === product.id)?.name[
            locale
          ],
        ).toBe(product.name[locale]);
        expect(decodedMail(sink.messages[before])).toContain(
          `3 × ${product.name[locale]} (${product.id})`,
        );
      }
      expect(sink.messages).toHaveLength(before + 1);
      await expect(
        adapter.submit({ ...sampler, message: 'Changed request content.' }),
      ).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' });
      await expect(
        adapter.submit({
          ...sampler,
          requestId: randomUUID(),
          samplerItems: [{ ...sampler.samplerItems[0], quantity: 6, name: 'Browser forgery' }],
        }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        adapter.submit({
          ...sampler,
          requestId: randomUUID(),
          samplerItems: [{ productId: 'ffffffffffffffffffffffff', quantity: 6 }],
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(sink.messages).toHaveLength(before + 1);
    },
  );

  it('uses the merged authenticated quote route for sent, duplicate and failed notifications', async () => {
    const registration = await request(server).post('/api/auth/register').send({
      name: 'Synthetic Partner',
      email: 'partner@example.test',
      password: 'Synthetic-demo-password-2026',
      role: 'b2b',
      companyName: 'Fictional Company',
    });
    expect(registration.status).toBe(201);
    const token: string = registration.body.data.token;
    const metadata = {
      cacaoProfile: 'dark70',
      quantity: 50,
      packaging: 'sleeve',
      companyName: 'Fictional Company',
      contactEmail: 'partner@example.test',
      locale: 'en',
      requestId: randomUUID(),
    };
    const submit = (body: typeof metadata) =>
      request(server)
        .post('/api/b2b/quote')
        .set('Authorization', `Bearer ${token}`)
        .field('metadata', JSON.stringify(body))
        .attach('designFile', Buffer.from('%PDF-1.4\nSynthetic demo design\n%%EOF'), {
          filename: 'demo.pdf',
          contentType: 'application/pdf',
        });
    const before = sink.messages.length;
    const sent = await submit(metadata);
    expect(sent.status).toBe(201);
    expect(sent.body.data.notificationStatus).toBe('sent');
    const replay = await submit(metadata);
    expect(replay.status).toBe(201);
    expect(replay.body.data).toEqual(sent.body.data);
    expect(sink.messages).toHaveLength(before + 1);
    expect(decodedMail(sink.messages[before])).toContain(sent.body.data.id);
    await sink.stop();
    const failedInput = { ...metadata, requestId: randomUUID() };
    const failed = await submit(failedInput);
    expect(failed.status).toBe(201);
    expect(failed.body.data.notificationStatus).toBe('failed');
    expect((await submit(failedInput)).body.data).toEqual(failed.body.data);
    const read = await request(server)
      .get(`/api/b2b/quotes/${failed.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body.data.notificationStatus).toBe('failed');
  });

  it('persists feedback and keeps notification failure truthful after SMTP stops', async () => {
    const adapter = createHttpSupport(createHttpClient(() => null));
    const feedback = { ...input, category: 'feedback' as const, requestId: randomUUID() };
    const receipt = await adapter.submit(feedback);
    expect(receipt.notificationStatus).toBe('failed');
    expect(await adapter.submit(feedback)).toEqual(receipt);
    const record = await InquiryModel.findById(receipt.id).lean();
    expect(record?.category).toBe('feedback');
    expect(record?.status).toBe('received');
    expect(record?.notificationStatus).toBe('failed');
  });

  it('returns the aligned global JSON parser error codes without creating inquiries', async () => {
    const before = await InquiryModel.countDocuments();
    const malformed = await request(server)
      .post('/api/inquiries')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
    const oversized = await request(server)
      .post('/api/inquiries')
      .send({ ...input, message: 'a'.repeat(110000) });
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe('VALIDATION_ERROR');
    expect(await InquiryModel.countDocuments()).toBe(before);
  });
});
