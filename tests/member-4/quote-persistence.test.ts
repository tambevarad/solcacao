import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { B2bRequest } from '../../server/src/features/b2b/model.js';
import {
  BUSINESS_A,
  BUSINESS_B,
  createQuoteTestApp,
  pdfBytes,
  validInput,
} from './quote-test-app.js';

// Real MongoDB persistence (docs/contracts.md: tests use an isolated TEST_MONGODB_URI). Skipped,
// and reported as skipped, when it is not set; CI has no Mongo service until Student 1 adds it.
const uri = process.env.TEST_MONGODB_URI ?? '';

describe.skipIf(!uri)('B2B quote persistence (real MongoDB)', () => {
  beforeAll(async () => {
    await mongoose.connect(uri);
    await B2bRequest.init();
  });
  beforeEach(async () => {
    await B2bRequest.deleteMany({});
  });
  afterAll(async () => {
    await B2bRequest.deleteMany({});
    await mongoose.disconnect();
  });

  it('saves the request and file privately before notifying, and returns a clean receipt', async () => {
    let savedBeforeNotify = 0;
    const quote = await createQuoteTestApp({
      notifyQuote: async () => {
        savedBeforeNotify = await B2bRequest.countDocuments();
        return 'sent';
      },
    });
    const response = await quote.submit(BUSINESS_A, { filename: '../../etc/evil".pdf' });
    expect(response.status).toBe(201);
    const receipt = response.body.data;
    expect(Object.keys(receipt).sort()).toEqual([
      'createdAt',
      'id',
      'notificationStatus',
      'status',
    ]);
    expect(receipt).toMatchObject({ status: 'submitted', notificationStatus: 'sent' });
    expect(receipt.id).toMatch(/^[a-f0-9]{24}$/);
    expect(new Date(receipt.createdAt).toISOString()).toBe(receipt.createdAt);
    expect(savedBeforeNotify).toBe(1);

    expect(quote.notifyQuote).toHaveBeenCalledExactlyOnceWith({
      quoteId: receipt.id,
      companyName: 'Test Co',
      contactEmail: 'buyer@example.test',
      locale: 'en',
    });
    const saved = await B2bRequest.findById(receipt.id).lean();
    expect(saved).toMatchObject({
      quantity: 250,
      packaging: 'giftBox',
      fileOriginalName: 'evil.pdf',
      fileMime: 'application/pdf',
      fileSize: pdfBytes().length,
      notificationStatus: 'sent',
    });
    expect(saved?.userId.toString()).toBe(BUSINESS_A.split(':')[0]);
    const files = await quote.storedFiles();
    expect(files).toEqual([saved?.fileKey]);
    expect(files[0]).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(await readFile(path.join(quote.uploadRoot, 'b2b', files[0]))).toEqual(pdfBytes());
  });

  it.each([
    ['failed', async () => 'failed' as const],
    ['throws', async (): Promise<'sent'> => Promise.reject(new Error('SMTP down'))],
  ])(
    'keeps the saved request when the notification %s, and says so',
    async (_label, notifyQuote) => {
      const quote = await createQuoteTestApp({ notifyQuote });
      const response = await quote.submit(BUSINESS_A);
      expect(response.status).toBe(201);
      expect(response.body.data.notificationStatus).toBe('failed');
      expect(await B2bRequest.countDocuments({ notificationStatus: 'failed' })).toBe(1);
      expect(await quote.storedFiles()).toHaveLength(1);
    },
  );

  it('returns the original receipt for an identical retry without a new file or email', async () => {
    const quote = await createQuoteTestApp();
    const first = await quote.submit(BUSINESS_A);
    const retry = await quote.submit(BUSINESS_A);
    expect(retry.status).toBe(201);
    expect(retry.body.data).toEqual(first.body.data);
    expect(await B2bRequest.countDocuments()).toBe(1);
    expect(await quote.storedFiles()).toHaveLength(1);
    expect(quote.notifyQuote).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['different metadata', { metadata: JSON.stringify(validInput({ quantity: 300 })) }],
    ['a different file', { file: pdfBytes('b') }],
  ])(
    'rejects a reused requestId with %s (409) and removes the new file',
    async (_label, options) => {
      const quote = await createQuoteTestApp();
      await quote.submit(BUSINESS_A);
      const conflict = await quote.submit(BUSINESS_A, options);
      expect(conflict.status).toBe(409);
      expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
      expect(await B2bRequest.countDocuments()).toBe(1);
      expect(await quote.storedFiles()).toHaveLength(1);
    },
  );

  it('turns two identical concurrent submissions into one request, file and notification', async () => {
    const quote = await createQuoteTestApp();
    const [a, b] = await Promise.all([quote.submit(BUSINESS_A), quote.submit(BUSINESS_A)]);
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(a.body.data.id).toBe(b.body.data.id);
    expect(await B2bRequest.countDocuments()).toBe(1);
    expect(await quote.storedFiles()).toHaveLength(1);
    expect(quote.notifyQuote).toHaveBeenCalledTimes(1);
  });

  it('keys idempotency by user, so two businesses can use the same requestId', async () => {
    const quote = await createQuoteTestApp();
    const a = await quote.submit(BUSINESS_A);
    const b = await quote.submit(BUSINESS_B);
    expect(b.status).toBe(201);
    expect(b.body.data.id).not.toBe(a.body.data.id);
  });

  it('deletes the stored file when saving the request fails', async () => {
    const quote = await createQuoteTestApp();
    vi.spyOn(B2bRequest, 'create').mockRejectedValueOnce(new Error('write failed'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await quote.submit(BUSINESS_A);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    });
    expect(await quote.storedFiles()).toEqual([]);
    expect(quote.notifyQuote).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });

  it('serves the receipt and file to their owner only', async () => {
    const quote = await createQuoteTestApp();
    const created = await quote.submit(BUSINESS_A, { filename: 'Logo Final.pdf' });
    const id: string = created.body.data.id;

    const own = await request(quote.app)
      .get(`/api/b2b/quotes/${id}`)
      .set('x-test-user', BUSINESS_A);
    expect(own.status).toBe(200);
    expect(own.body.data).toEqual(created.body.data);
    expect(own.headers['cache-control']).toBe('private, no-store');

    const file = await request(quote.app)
      .get(`/api/b2b/quotes/${id}/file`)
      .set('x-test-user', BUSINESS_A)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/^application\/pdf/);
    expect(file.headers['content-disposition']).toBe('attachment; filename="Logo Final.pdf"');
    expect(file.headers['x-content-type-options']).toBe('nosniff');
    expect(file.body).toEqual(pdfBytes());

    for (const path of [`/api/b2b/quotes/${id}`, `/api/b2b/quotes/${id}/file`]) {
      const other = await request(quote.app).get(path).set('x-test-user', BUSINESS_B);
      expect(other.status, path).toBe(404);
      expect(other.body.error.code).toBe('NOT_FOUND');
    }
    const missing = await request(quote.app)
      .get('/api/b2b/quotes/0123456789abcdef01234567')
      .set('x-test-user', BUSINESS_A);
    expect(missing.status).toBe(404);
  });
});
