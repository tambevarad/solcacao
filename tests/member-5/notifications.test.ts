import { describe, expect, it, vi } from 'vitest';
import {
  createNotifications,
  createNotificationTransport,
  type NotificationMessage,
} from '../../server/src/features/support/notifications.js';
import { input, product } from './fixtures.js';

const env = { MAIL_FROM: 'demo@example.test', SUPPORT_EMAIL: 'support@example.test' };
const quote = {
  quoteId: product.id,
  companyName: '<img src=x> & Partners',
  contactEmail: input.email,
  locale: input.locale,
};

describe('notification bridge', () => {
  it('escapes HTML, fixes envelope fields, and acknowledges the configured recipient', async () => {
    const sendMail = vi.fn(async (_mail: NotificationMessage) => ({
      accepted: [env.SUPPORT_EMAIL],
    }));
    const notifications = createNotifications({ env, transport: { sendMail } });
    expect(await notifications.notifyQuote(quote)).toBe('sent');
    const message = sendMail.mock.calls[0][0];
    expect(message.html).toContain('&lt;img src=x&gt; &amp; Partners');
    expect(message.html).not.toContain('<img');
    expect(message.to).toBe(env.SUPPORT_EMAIL);
    expect(message.from).toBe(env.MAIL_FROM);
    expect(message.replyTo).toBe(input.email);
    expect(message).not.toHaveProperty('attachments');
    expect(
      await notifications.notifyInquiry({
        ...input,
        inquiryId: product.id,
        message: '<script>alert("x")</script>',
      }),
    ).toBe('sent');
    expect(sendMail.mock.calls[1][0].html).toContain('&lt;script&gt;');
  });

  it('returns failed for outage, missing acknowledgement, unsafe headers and missing config', async () => {
    for (const sendMail of [
      vi.fn(async () => {
        throw new Error('offline');
      }),
      vi.fn(async () => ({ accepted: [] })),
    ])
      expect(await createNotifications({ env, transport: { sendMail } }).notifyQuote(quote)).toBe(
        'failed',
      );
    const sendMail = vi.fn(async () => ({ accepted: [env.SUPPORT_EMAIL] }));
    const notifications = createNotifications({ env, transport: { sendMail } });
    expect(
      await notifications.notifyQuote({
        ...quote,
        contactEmail: 'x@example.test\r\nBcc: other@example.test',
      }),
    ).toBe('failed');
    expect(await createNotifications({ env: {}, transport: { sendMail } }).notifyQuote(quote)).toBe(
      'failed',
    );
    expect(sendMail).not.toHaveBeenCalled();
    expect(() => createNotificationTransport({ SMTP_HOST: 'external.example.test' })).toThrow();
  });
});
