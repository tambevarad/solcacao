import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuoteInput, User } from '../../contracts/index.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import { NotImplementedError } from '../../client/src/api/notImplemented.js';
import { createHttpB2B } from '../../client/src/features/b2b/http.js';
import { createMockB2B, type MockB2bOptions } from '../../client/src/features/b2b/mock.js';
import { MAX_FILE_BYTES } from '../../client/src/features/b2b/options.js';

const input: QuoteInput = {
  cacaoProfile: 'dark85',
  quantity: 500,
  packaging: 'sleeve',
  companyName: 'Test Co',
  contactEmail: 'buyer@example.test',
  locale: 'en',
  requestId: 'abcdef12-3456-4789-8abc-def012345678',
};
const business: User = {
  id: '0000000000000000000000b2',
  name: 'Test Buyer',
  email: 'buyer@example.test',
  role: 'b2b',
  companyName: 'Test Co',
};
const pdf = (name = 'brand.pdf', body = '%PDF-1.4\n') =>
  new File([body], name, { type: 'application/pdf' });
const unusedHttp = createHttpClient(() => null);

function mock(options: MockB2bOptions = {}) {
  return createMockB2B(unusedHttp, {
    identity: async () => business,
    delayMs: 0,
    now: () => new Date('2026-10-25T12:00:00.000Z'),
    ...options,
  });
}

describe('b2b mock adapter', () => {
  it('returns a deterministic receipt that never claims an email was sent', async () => {
    expect(await mock().submit(input, pdf())).toEqual({
      id: 'abcdef12345647898abcdef0',
      status: 'submitted',
      createdAt: '2026-10-25T12:00:00.000Z',
      notificationStatus: 'pending',
    });
  });

  it('returns the original receipt for a retry with the same requestId and body', async () => {
    let clock = 0;
    const api = mock({ now: () => new Date(Date.UTC(2026, 9, 25, 12, 0, clock++)) });
    const first = await api.submit(input, pdf());
    expect(await api.submit(input, pdf())).toEqual(first);
  });

  it('rejects a reused requestId with different data', async () => {
    const api = mock();
    await api.submit(input, pdf());
    await expect(api.submit({ ...input, quantity: 600 }, pdf())).rejects.toMatchObject({
      status: 409,
      code: 'IDEMPOTENCY_CONFLICT',
    });
  });

  it('enforces the business role and a signed-in identity', async () => {
    await expect(
      mock({ identity: async () => ({ ...business, role: 'retail' }) }).submit(input, pdf()),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    const signedOut = mock({
      identity: () => Promise.reject(new ApiError(401, 'UNAUTHORIZED', 'Sign in')),
    });
    await expect(signedOut.submit(input, pdf())).rejects.toMatchObject({ status: 401 });
  });

  it('asks the auth mock at call time by default (still a template stub)', async () => {
    const api = createMockB2B(unusedHttp, { delayMs: 0 });
    await expect(api.submit(input, pdf())).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('mirrors server validation and file errors', async () => {
    await expect(mock().submit({ ...input, quantity: 49 }, pdf())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { quantity: expect.any(String) },
    });
    await expect(
      mock().submit(input, new File(['%PDF-'], 'brand.png', { type: 'image/png' })),
    ).rejects.toMatchObject({ status: 415, code: 'UNSUPPORTED_FILE' });
    await expect(mock().submit(input, pdf('fake.pdf', 'hello'))).rejects.toMatchObject({
      status: 415,
    });
    const big = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    await expect(mock().submit(input, big)).rejects.toMatchObject({
      status: 413,
      code: 'FILE_TOO_LARGE',
    });
  });

  it('can fail the first attempt so the retry path can be demonstrated', async () => {
    const api = mock({ scenario: 'fail-first' });
    await expect(api.submit(input, pdf())).rejects.toMatchObject({ status: 503 });
    await expect(api.submit(input, pdf())).resolves.toMatchObject({ status: 'submitted' });
  });

  it('can report a failed notification truthfully', async () => {
    expect(await mock({ scenario: 'notification-failed' }).submit(input, pdf())).toMatchObject({
      notificationStatus: 'failed',
    });
  });
});

describe('b2b HTTP adapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts metadata JSON and designFile as multipart without setting Content-Type', async () => {
    const receipt = {
      id: '0123456789abcdef01234567',
      status: 'submitted',
      createdAt: '2026-10-25T12:00:00.000Z',
      notificationStatus: 'sent',
    };
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify({ data: receipt }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = pdf();
    const result = await createHttpB2B(createHttpClient(() => 'test-token')).submit(input, file);
    expect(result).toEqual(receipt);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/b2b/quote');
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    const body = init.body;
    if (!(body instanceof FormData)) throw new Error('expected a FormData body');
    expect([...body.keys()]).toEqual(['metadata', 'designFile']);
    expect(JSON.parse(String(body.get('metadata')))).toEqual(input);
    const sent = body.get('designFile');
    expect(sent).toBeInstanceOf(File);
    expect(sent instanceof File && sent.name).toBe('brand.pdf');
  });

  it('surfaces upload errors as ApiError for the wizard to map', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: 'FILE_TOO_LARGE', message: 'File too large' } }),
            { status: 413 },
          ),
      ),
    );
    const error = await createHttpB2B(createHttpClient(() => null))
      .submit(input, pdf())
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 413, code: 'FILE_TOO_LARGE' });
  });
});
