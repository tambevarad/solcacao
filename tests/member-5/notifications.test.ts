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
  it.each(['en', 'es'] as const)(
    'includes trusted localized sampler details and escapes them in %s',
    async (locale) => {
      const sendMail = vi.fn(async (_mail: NotificationMessage) => ({
        accepted: [env.SUPPORT_EMAIL],
      }));
      const name = { en: '<Test> & bar', es: '<Prueba> & barra' };
      const notifications = createNotifications({ env, transport: { sendMail } });
      expect(
        await notifications.notifyInquiry({
          ...input,
          inquiryId: product.id,
          category: 'sampler',
          locale,
          samplerSelection: [{ productId: product.id, quantity: 6, name }],
        }),
      ).toBe('sent');
      const mail = sendMail.mock.calls[0][0];
      expect(mail.text).toContain(`6 × ${name[locale]} (${product.id})`);
      expect(mail.html).toContain(
        locale === 'en' ? '&lt;Test&gt; &amp; bar' : '&lt;Prueba&gt; &amp; barra',
      );
      expect(mail.html).not.toContain(name[locale]);
      expect(mail.text).toContain(locale === 'en' ? 'this is not an order' : 'no es un pedido');
      expect(mail.to).toBe(env.SUPPORT_EMAIL);
      expect(
        await notifications.notifyInquiry({ ...input, inquiryId: product.id, category: 'sampler' }),
      ).toBe('failed');
      expect(sendMail).toHaveBeenCalledTimes(1);
    },
  );
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
    expect(message.text).toContain(
      'Request received; this does not confirm pricing, production or delivery.',
    );
    expect(
      await notifications.notifyInquiry({
        ...input,
        inquiryId: product.id,
        message: '<script>alert("x")</script>',
      }),
    ).toBe('sent');
    expect(sendMail.mock.calls[1][0].html).toContain('&lt;script&gt;');
    expect(await notifications.notifyQuote({ ...quote, locale: 'es' })).toBe('sent');
    expect(sendMail.mock.calls[2][0].text).toContain(
      'Solicitud recibida; no confirma precio, producción ni entrega.',
    );
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
