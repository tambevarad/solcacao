import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app as realApp } from '../../server/src/app.js';
import { MAX_DESIGN_FILE_BYTES, safeDisplayName } from '../../server/src/features/b2b/upload.js';
import { BUSINESS_A, RETAIL, createQuoteTestApp, pdfBytes, validInput } from './quote-test-app.js';

// These checks run before any database access, so they need no MongoDB.
describe('POST /api/b2b/quote rejects before storing anything', () => {
  it('fails closed in the real app until Student 1 auth exists, including for mock tokens', async () => {
    const anonymous = await request(realApp).post('/api/b2b/quote').field('metadata', '{}');
    expect(anonymous.status).toBe(401);
    expect(anonymous.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    const mockToken = await request(realApp)
      .get('/api/b2b/quotes/0123456789abcdef01234567')
      .set('Authorization', 'Bearer mock:0000000000000000000000b2');
    expect(mockToken.status).toBe(401);
    // Other features' routes still fall through to their own routers.
    expect((await request(realApp).post('/api/inquiries').send({})).status).toBe(404);
  });

  it('rejects a missing token and a retail role before reading the upload', async () => {
    const quote = await createQuoteTestApp();
    // A broken multipart body makes multer answer 400. Getting 401/403 instead proves the auth
    // and role checks ran first and the upload was never parsed.
    const broken = (user: string | null) => {
      const call = request(quote.app)
        .post('/api/b2b/quote')
        .set('Content-Type', 'multipart/form-data; boundary=broken');
      return (user ? call.set('x-test-user', user) : call).send('--broken\r\nnot a part');
    };
    expect((await broken(BUSINESS_A)).status).toBe(400);
    expect((await broken(null)).status).toBe(401);
    const retail = await broken(RETAIL);
    expect(retail.status).toBe(403);
    expect(retail.body.error.code).toBe('FORBIDDEN');
    expect((await quote.submit(null)).status).toBe(401);
    expect((await quote.submit(RETAIL)).status).toBe(403);
    expect(await quote.storedFiles()).toEqual([]);
    expect(quote.notifyQuote).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed JSON', { metadata: '{"quantity":' }, 'metadata'],
    [
      'an unexpected metadata field',
      { metadata: JSON.stringify({ ...validInput(), priceCents: 1 }) },
      'priceCents',
    ],
    [
      'a quantity below the minimum',
      { metadata: JSON.stringify(validInput({ quantity: 49 })) },
      'quantity',
    ],
    [
      'a fractional quantity',
      { metadata: JSON.stringify(validInput({ quantity: 50.5 })) },
      'quantity',
    ],
    [
      'a malformed requestId',
      { metadata: JSON.stringify(validInput({ requestId: 'abc' })) },
      'requestId',
    ],
    ['a missing file', { file: null }, 'designFile'],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, options, field) => {
    const quote = await createQuoteTestApp();
    const response = await quote.submit(BUSINESS_A, options);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fieldErrors).toHaveProperty(field);
    expect(await quote.storedFiles()).toEqual([]);
  });

  it('rejects extra multipart fields and unexpected file fields', async () => {
    const quote = await createQuoteTestApp();
    const extraField = await quote.submit(BUSINESS_A).field('role', 'b2b');
    expect(extraField.status).toBe(400);
    const extraFile = await quote
      .submit(BUSINESS_A)
      .attach('logo', pdfBytes(), { filename: 'logo.pdf', contentType: 'application/pdf' });
    expect(extraFile.status).toBe(400);
    expect(await quote.storedFiles()).toEqual([]);
  });

  it.each([
    ['a non-PDF MIME type', { contentType: 'text/plain' }],
    ['a non-PDF extension', { filename: 'brand.png' }],
    [
      'a spoofed MIME type without the PDF signature',
      { file: Buffer.from('<svg onload=alert(1)>') },
    ],
  ])('returns 415 UNSUPPORTED_FILE for %s', async (_label, options) => {
    const quote = await createQuoteTestApp();
    const response = await quote.submit(BUSINESS_A, options);
    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE');
    expect(await quote.storedFiles()).toEqual([]);
  });

  it('returns 413 FILE_TOO_LARGE above 5 MiB', async () => {
    const quote = await createQuoteTestApp();
    const big = Buffer.concat([pdfBytes(), Buffer.alloc(MAX_DESIGN_FILE_BYTES, 0x20)]);
    const response = await quote.submit(BUSINESS_A, { file: big });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    expect(await quote.storedFiles()).toEqual([]);
  });

  it('returns 503 without storing the file when the database is unavailable', async () => {
    const quote = await createQuoteTestApp();
    const response = await quote.submit(BUSINESS_A);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(await quote.storedFiles()).toEqual([]);
    expect(quote.notifyQuote).not.toHaveBeenCalled();
  });
});

describe('GET /api/b2b/quotes/:id', () => {
  it('requires a business account and a well-formed id', async () => {
    const quote = await createQuoteTestApp();
    expect((await request(quote.app).get('/api/b2b/quotes/0123456789abcdef01234567')).status).toBe(
      401,
    );
    expect(
      (
        await request(quote.app)
          .get('/api/b2b/quotes/0123456789abcdef01234567')
          .set('x-test-user', RETAIL)
      ).status,
    ).toBe(403);
    for (const id of ['abc', '../../etc/passwd', '0123456789abcdef0123456z']) {
      const response = await request(quote.app)
        .get(`/api/b2b/quotes/${encodeURIComponent(id)}/file`)
        .set('x-test-user', BUSINESS_A);
      expect(response.status, id).toBe(400);
    }
  });
});

describe('stored display names', () => {
  it('strips paths, quotes and control characters', () => {
    expect(safeDisplayName('../../etc/evil".pdf')).toBe('evil.pdf');
    expect(safeDisplayName('C:\\Users\\me\\logo\r\n.pdf')).toBe('logo.pdf');
    expect(safeDisplayName('.pdf')).toBe('design.pdf');
  });
});
