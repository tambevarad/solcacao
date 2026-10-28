import { describe, expect, it, vi } from 'vitest';
import {
  createMockSupport,
  simulateNextInquiryFailure,
} from '../../client/src/features/support/mock.js';
import { createHttpSupport } from '../../client/src/features/support/http.js';
import { supportInquirySchema, whatsappUrl } from '../../client/src/features/support/rules.js';
import { input, product, unusedHttp } from './fixtures.js';

describe('support boundaries and adapters', () => {
  it('rejects invalid email, short text, unknown fields, duplicate IDs and non-six totals', () => {
    for (const bad of [
      { ...input, email: 'invalid' },
      { ...input, message: 'short' },
      { ...input, to: 'other@example.test' },
      { ...input, samplerItems: [] },
      ...[5, 7].map((quantity) => ({
        ...input,
        category: 'sampler',
        samplerItems: [{ productId: product.id, quantity }],
      })),
      {
        ...input,
        category: 'sampler',
        samplerItems: [
          { productId: product.id, quantity: 3 },
          { productId: product.id, quantity: 3 },
        ],
      },
    ])
      expect(supportInquirySchema.safeParse(bad).success).toBe(false);
  });

  it('retries once after lost response and conflicts on changed bodies', async () => {
    const afterSave = vi.fn().mockImplementationOnce(() => {
      throw new Error('Lost response');
    });
    const mock = createMockSupport(unusedHttp, { delayMs: 0, afterSave });
    await expect(mock.submit(input)).rejects.toThrow('Lost response');
    const replay = await mock.submit(input);
    expect(await mock.submit(input)).toEqual(replay);
    expect(afterSave).toHaveBeenCalledTimes(1);
    await expect(
      mock.submit({ ...input, message: 'A different message body.' }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    replay.id = 'mutated';
    expect((await mock.submit(input)).id).not.toBe('mutated');
  });

  it('deduplicates concurrent mock requests and permits retry after simulated failure', async () => {
    const mock = createMockSupport(unusedHttp, { delayMs: 0 });
    simulateNextInquiryFailure();
    await expect(mock.submit(input)).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    const [a, b] = await Promise.all([mock.submit(input), mock.submit(input)]);
    expect(a).toEqual(b);
  });

  it('accepts six active pieces, rejects inactive products without fabricating catalog data', async () => {
    const sampler = {
      ...input,
      category: 'sampler' as const,
      samplerItems: [{ productId: product.id, quantity: 6 }],
    };
    const active = createMockSupport(unusedHttp, { delayMs: 0, products: async () => [product] });
    expect((await active.submit(sampler)).status).toBe('received');
    for (const products of [[], [{ ...product, active: false }]]) {
      const mock = createMockSupport(unusedHttp, { delayMs: 0, products: async () => products });
      await expect(mock.submit(sampler)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    }
  });

  it('sends only the contract body through the envelope-unwrapping common transport', async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ id: product.id, status: 'received', notificationStatus: 'failed' });
    const adapter = createHttpSupport({ ...unusedHttp, request });
    expect((await adapter.submit(input)).notificationStatus).toBe('failed');
    expect(request).toHaveBeenCalledWith('/inquiries', { method: 'POST', body: input });
    request.mockRejectedValueOnce(new Error('Network failure'));
    await expect(adapter.submit(input)).rejects.toThrow('Network failure');
  });

  it('hides invalid WhatsApp numbers and encodes only a generic message', () => {
    for (const number of [undefined, '', '+15555555555', '123 abc', '0000000000'])
      expect(whatsappUrl(number, 'Hello')).toBeNull();
    expect(whatsappUrl('15555555555', 'Hello & hola?')).toBe(
      'https://wa.me/15555555555?text=Hello%20%26%20hola%3F',
    );
  });
});
