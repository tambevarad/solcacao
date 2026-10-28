import { describe, expect, it, vi } from 'vitest';
import type { InquiryInput, Product } from '../../contracts/index.js';
import {
  createInquiryService,
  type InquiryStore,
  type SavedInquiry,
} from '../../server/src/features/support/service.js';
import { input, product } from './fixtures.js';

function storeDouble() {
  const records = new Map<string, SavedInquiry>();
  const snapshots: Product[][] = [];
  const store: InquiryStore = {
    async find(id) {
      return records.get(id) ?? null;
    },
    async create(data: InquiryInput, hash, products) {
      if (records.has(data.requestId)) throw { code: 11000 };
      const record: SavedInquiry = {
        id: product.id,
        requestId: data.requestId,
        requestHash: hash,
        notificationStatus: 'pending',
      };
      records.set(data.requestId, record);
      snapshots.push(products);
      return { ...record };
    },
    async markNotification(id, status) {
      for (const record of records.values())
        if (record.id === id) record.notificationStatus = status;
    },
  };
  return { store, records, snapshots };
}

describe('inquiry persistence and notifications', () => {
  it('saves before notifying, and does not send twice on idempotent retry', async () => {
    const { store, records } = storeDouble();
    const notify = vi.fn(async () => {
      expect(records.size).toBe(1);
      return 'sent' as const;
    });
    const submit = createInquiryService({ store, notify });
    const receipt = await submit(input);
    expect(receipt.notificationStatus).toBe('sent');
    expect(await submit({ ...input, email: input.email.toUpperCase() })).toEqual(receipt);
    expect(notify).toHaveBeenCalledTimes(1);
    await expect(submit({ ...input, name: 'Changed person' })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('retains a received record after SMTP outage and never automatically retries mail', async () => {
    const { store, records } = storeDouble();
    const notify = vi.fn(async (): Promise<'sent' | 'failed'> => {
      throw new Error('SMTP down');
    });
    const submit = createInquiryService({ store, notify });
    expect((await submit(input)).notificationStatus).toBe('failed');
    expect(records.size).toBe(1);
    expect((await submit(input)).notificationStatus).toBe('failed');
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('returns saved pending receipt if the delivery status cannot be persisted', async () => {
    const { store } = storeDouble();
    store.markNotification = async () => {
      throw new Error('DB write failed');
    };
    const notify = vi.fn(async () => 'sent' as const);
    const submit = createInquiryService({ store, notify });
    expect((await submit(input)).notificationStatus).toBe('pending');
    expect((await submit(input)).notificationStatus).toBe('pending');
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('concurrent retries create one record and one notification', async () => {
    const { store, records } = storeDouble();
    const notify = vi.fn(async () => 'sent' as const);
    const submit = createInquiryService({ store, notify });
    const receipts = await Promise.all([submit(input), submit(input)]);
    expect(receipts.every((receipt) => receipt.id === product.id)).toBe(true);
    expect(records.size).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('validates active products on server and stores trusted snapshots only', async () => {
    const sampler = {
      ...input,
      category: 'sampler',
      samplerItems: [{ productId: product.id, quantity: 6 }],
    };
    const { store, snapshots } = storeDouble();
    const products = vi.fn(async () => [product]);
    const submit = createInquiryService({ store, products, notify: async () => 'sent' });
    await submit(sampler);
    expect(products).toHaveBeenCalledWith([product.id]);
    expect(snapshots).toEqual([[product]]);
    for (const list of [[], [{ ...product, active: false }]]) {
      const other = createInquiryService({
        store: storeDouble().store,
        products: async () => list,
      });
      await expect(other(sampler)).rejects.toMatchObject({ status: 400 });
    }
    await expect(submit({ ...sampler, to: 'attacker@example.test' })).rejects.toMatchObject({
      status: 400,
    });
  });
});
