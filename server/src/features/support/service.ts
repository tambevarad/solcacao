import { createHash } from 'node:crypto';
import type { InquiryInput, InquiryReceipt, Product } from '../../../../contracts/index.js';
import {
  canonicalInquiry,
  normalizeInquiry,
  supportInquirySchema,
} from '../../../../client/src/features/support/rules.js';
import { getActiveProductsByIds } from '../catalog/service.js';
import { InquiryModel } from './model.js';
import { createNotifications, type InquiryNotificationInput } from './notifications.js';
import { SupportError } from './errors.js';

export interface SavedInquiry {
  id: string;
  requestId: string;
  requestHash: string;
  notificationStatus: InquiryReceipt['notificationStatus'];
}
export interface InquiryStore {
  find(requestId: string): Promise<SavedInquiry | null>;
  create(input: InquiryInput, hash: string, products: Product[]): Promise<SavedInquiry>;
  markNotification(id: string, status: 'sent' | 'failed'): Promise<void>;
}
export const mongoInquiryStore: InquiryStore = {
  async find(requestId) {
    const record = await InquiryModel.findOne({ requestId }).select('+requestHash').lean();
    return record
      ? {
          id: record._id.toString(),
          requestId: record.requestId,
          requestHash: record.requestHash,
          notificationStatus: record.notificationStatus,
        }
      : null;
  },
  async create(input, requestHash, products) {
    const record = await InquiryModel.create({
      ...input,
      requestHash,
      ...(input.samplerItems
        ? {
            samplerItems: input.samplerItems.map((item) => ({
              ...item,
              name: products.find((product) => product.id === item.productId)!.name,
            })),
          }
        : {}),
    });
    return {
      id: record._id.toString(),
      requestId: record.requestId,
      requestHash,
      notificationStatus: record.notificationStatus,
    };
  },
  async markNotification(id, notificationStatus) {
    await InquiryModel.updateOne({ _id: id }, { $set: { notificationStatus } });
  },
};

function duplicate(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 11000;
}
const receiptOf = (record: SavedInquiry): InquiryReceipt => ({
  id: record.id,
  status: 'received',
  notificationStatus: record.notificationStatus,
});

export function createInquiryService(
  options: {
    store?: InquiryStore;
    products?: (ids: string[]) => Promise<Product[]>;
    notify?: (input: InquiryNotificationInput) => Promise<'sent' | 'failed'>;
  } = {},
) {
  const store = options.store ?? mongoInquiryStore;
  return async function submit(raw: unknown): Promise<InquiryReceipt> {
    const parsed = supportInquirySchema.safeParse(raw);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fields[issue.path.join('.') || 'form'] = issue.message;
      throw new SupportError(400, 'VALIDATION_ERROR', 'Invalid inquiry', fields);
    }
    const input = normalizeInquiry(parsed.data);
    const hash = createHash('sha256').update(canonicalInquiry(input)).digest('hex');
    function replay(record: SavedInquiry) {
      if (record.requestHash !== hash)
        throw new SupportError(409, 'IDEMPOTENCY_CONFLICT', 'Request ID already used');
      return receiptOf(record);
    }
    const existing = await store.find(input.requestId);
    if (existing) return replay(existing);
    const ids = input.samplerItems?.map((item) => item.productId) ?? [];
    const products = ids.length ? await (options.products ?? getActiveProductsByIds)(ids) : [];
    if (ids.some((id) => !products.some((product) => product.id === id && product.active)))
      throw new SupportError(400, 'VALIDATION_ERROR', 'Product unavailable', {
        samplerItems: 'Product unavailable',
      });
    let saved: SavedInquiry;
    try {
      saved = await store.create(input, hash, products);
    } catch (error) {
      if (duplicate(error)) {
        const winner = await store.find(input.requestId);
        if (winner) return replay(winner);
      }
      throw error;
    }
    let notificationStatus: 'sent' | 'failed';
    try {
      notificationStatus = await (options.notify ?? createNotifications().notifyInquiry)({
        ...input,
        inquiryId: saved.id,
      });
    } catch {
      notificationStatus = 'failed';
    }
    try {
      await store.markNotification(saved.id, notificationStatus);
    } catch {
      return receiptOf(saved);
    }
    return { ...receiptOf(saved), notificationStatus };
  };
}
