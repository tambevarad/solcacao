import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { createInquiryService } from '../../server/src/features/support/service.js';
import { InquiryModel } from '../../server/src/features/support/model.js';
import {
  createNotifications,
  type NotificationMessage,
} from '../../server/src/features/support/notifications.js';
import { input, product } from './fixtures.js';

const uri = process.env.TEST_MONGODB_URI;
describe.skipIf(!uri)('isolated Mongo persistence with injected SMTP sink', () => {
  const mails: NotificationMessage[] = [];
  beforeAll(async () => {
    if (!uri || !/\/solcacao_test_[a-zA-Z0-9_-]+(?:\?|$)/.test(uri))
      throw new Error('TEST_MONGODB_URI must name a dedicated solcacao_test_* database');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    await InquiryModel.init();
  });
  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await InquiryModel.deleteMany({ requestId: input.requestId });
      await mongoose.disconnect();
    }
  });
  it('stores one inquiry and one captured message for concurrent retries; retains failed mail record', async () => {
    await InquiryModel.deleteMany({ requestId: input.requestId });
    const notifications = createNotifications({
      env: { MAIL_FROM: 'demo@example.test', SUPPORT_EMAIL: 'support@example.test' },
      transport: {
        async sendMail(message) {
          mails.push(message);
          return { accepted: ['support@example.test'] };
        },
      },
    });
    const submit = createInquiryService({
      products: async () => [product],
      notify: notifications.notifyInquiry,
    });
    const sampler = {
      ...input,
      category: 'sampler',
      samplerItems: [{ productId: product.id, quantity: 6 }],
    };
    const receipts = await Promise.all([submit(sampler), submit(sampler)]);
    expect(receipts[0].id).toBe(receipts[1].id);
    expect(await InquiryModel.countDocuments({ requestId: input.requestId })).toBe(1);
    expect(mails).toHaveLength(1);
    expect(
      (await InquiryModel.findOne({ requestId: input.requestId }).lean())?.samplerItems?.[0].name
        .en,
    ).toBe(product.name.en);
    await InquiryModel.deleteMany({ requestId: input.requestId });
    const failed = createInquiryService({ notify: async () => 'failed' });
    expect((await failed(input)).notificationStatus).toBe('failed');
    expect((await InquiryModel.findOne({ requestId: input.requestId }).lean())?.status).toBe(
      'received',
    );
  });
});
