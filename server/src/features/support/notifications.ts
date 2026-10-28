import nodemailer from 'nodemailer';
import { z } from 'zod';
import type { InquiryInput, Locale } from '../../../../contracts/index.js';
import { idSchema } from '../../../../contracts/validation.js';

export interface NotificationMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}
export interface NotificationTransport {
  sendMail(message: NotificationMessage): Promise<{ accepted: string[] }>;
}
export interface QuoteNotificationInput {
  quoteId: string;
  companyName: string;
  contactEmail: string;
  locale: Locale;
}
export type InquiryNotificationInput = Pick<
  InquiryInput,
  'name' | 'email' | 'category' | 'message' | 'locale'
> & { inquiryId: string };

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );

const emailSchema = z
  .string()
  .email()
  .max(254)
  .refine((value) => !/[\r\n]/.test(value));
const emailValid = (value: string | undefined): value is string =>
  emailSchema.safeParse(value).success;

export function createNotificationTransport(
  env: NodeJS.ProcessEnv = process.env,
): NotificationTransport {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 1025);
  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    (env.NODE_ENV !== 'production' && !['localhost', '127.0.0.1', '::1', 'mailpit'].includes(host))
  )
    throw new Error('SMTP configuration unavailable');
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: env.SMTP_SECURE === 'true',
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return {
    async sendMail(message) {
      const result = await transport.sendMail(message);
      return { accepted: result.accepted };
    },
  };
}

export function createNotifications(
  options: {
    transport?: NotificationTransport;
    env?: NodeJS.ProcessEnv;
  } = {},
) {
  const env = options.env ?? process.env;
  async function send(replyTo: string, subject: string, body: string): Promise<'sent' | 'failed'> {
    try {
      if (!emailValid(replyTo) || !emailValid(env.MAIL_FROM) || !emailValid(env.SUPPORT_EMAIL))
        return 'failed';
      const message: NotificationMessage = {
        from: env.MAIL_FROM,
        to: env.SUPPORT_EMAIL,
        replyTo,
        subject,
        text: body,
        html: `<div style="white-space:pre-wrap">${escapeHtml(body)}</div>`,
      };
      const result = await (options.transport ?? createNotificationTransport(env)).sendMail(
        message,
      );
      return result.accepted.some(
        (address) => address.toLowerCase() === env.SUPPORT_EMAIL?.toLowerCase(),
      )
        ? 'sent'
        : 'failed';
    } catch {
      console.warn('[support] notification attempt failed');
      return 'failed';
    }
  }
  return {
    async notifyQuote(input: QuoteNotificationInput): Promise<'sent' | 'failed'> {
      if (
        !idSchema.safeParse(input.quoteId).success ||
        !input.companyName.trim() ||
        input.companyName.length > 120 ||
        !['en', 'es'].includes(input.locale)
      )
        return 'failed';
      return send(
        input.contactEmail,
        input.locale === 'es' ? 'SolCacao: consulta mayorista' : 'SolCacao: wholesale quote',
        `Quote: ${input.quoteId}\nCompany: ${input.companyName}\nContact: ${input.contactEmail}`,
      );
    },
    async notifyInquiry(input: InquiryNotificationInput): Promise<'sent' | 'failed'> {
      if (!idSchema.safeParse(input.inquiryId).success) return 'failed';
      return send(
        input.email,
        input.locale === 'es' ? 'SolCacao: nueva consulta' : 'SolCacao: new enquiry',
        `Inquiry: ${input.inquiryId}\nCategory: ${input.category}\nName: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
      );
    },
  };
}

export async function notifyQuote(input: {
  quoteId: string;
  companyName: string;
  contactEmail: string;
  locale: Locale;
}): Promise<'sent' | 'failed'> {
  return createNotifications().notifyQuote(input);
}
