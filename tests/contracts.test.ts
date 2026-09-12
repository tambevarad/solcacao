import { describe, it, expect } from 'vitest';
import { registerSchema, quoteSchema, inquirySchema } from '../contracts/validation.js';
describe('shared boundary rules', () => {
  it('requires business identity while accepting retail registration', () => {
    const input = {
      name: 'Test',
      email: 'a@example.test',
      password: 'long-test-password',
      role: 'retail',
    };
    expect(registerSchema.safeParse(input).success).toBe(true);
    expect(registerSchema.safeParse({ ...input, role: 'b2b' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...input, role: 'admin' }).success).toBe(false);
  });
  it('rejects quantities below wholesale minimum and unknown fields', () => {
    const input = {
      cacaoProfile: 'dark70',
      quantity: 50,
      packaging: 'giftBox',
      companyName: 'Test',
      contactEmail: 'a@example.test',
      locale: 'en',
      requestId: '00000000-0000-4000-8000-000000000001',
    };
    expect(quoteSchema.safeParse(input).success).toBe(true);
    expect(quoteSchema.safeParse({ ...input, quantity: 49 }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...input, price: 1 }).success).toBe(false);
  });
  it('requires six sampler pieces', () => {
    const input = {
      name: 'Test',
      email: 'a@example.test',
      category: 'sampler',
      message: 'Please prepare this sampler',
      locale: 'es',
      requestId: '00000000-0000-4000-8000-000000000001',
      samplerItems: [{ productId: '000000000000000000000001', quantity: 6 }],
    };
    expect(inquirySchema.safeParse(input).success).toBe(true);
    expect(inquirySchema.safeParse({ ...input, samplerItems: [] }).success).toBe(false);
  });
});
