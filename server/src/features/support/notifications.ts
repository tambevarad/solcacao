import nodemailer from 'nodemailer';
import { z } from 'zod';
import type { InquiryInput, Locale, LocalizedText } from '../../../../contracts/index.js';
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
> & {
  inquiryId: string;
  samplerSelection?: { productId: string; quantity: number; name: LocalizedText }[];
};

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
        input.locale === 'es'
          ? `Consulta: ${input.quoteId}\nEmpresa: ${input.companyName}\nCorreo: ${input.contactEmail}\n\nSolicitud recibida; no confirma precio, producción ni entrega.`
          : `Quote: ${input.quoteId}\nCompany: ${input.companyName}\nContact: ${input.contactEmail}\n\nRequest received; this does not confirm pricing, production or delivery.`,
      );
    },
    async notifyInquiry(input: InquiryNotificationInput): Promise<'sent' | 'failed'> {
      if (!idSchema.safeParse(input.inquiryId).success || !['en', 'es'].includes(input.locale))
        return 'failed';
      const spanish = input.locale === 'es';
      const selection = input.samplerSelection ?? [];
      if (
        input.category === 'sampler' &&
        (!selection.length ||
          selection.length > 6 ||
          new Set(selection.map((item) => item.productId)).size !== selection.length ||
          selection.some(
            (item) =>
              !idSchema.safeParse(item.productId).success ||
              !Number.isInteger(item.quantity) ||
              item.quantity < 1 ||
              !item.name[input.locale]?.trim(),
          ) ||
          selection.reduce((total, item) => total + item.quantity, 0) !== 6)
      )
        return 'failed';
      const categories = spanish
        ? {
            support: 'Atención general',
            wholesale: 'Consulta mayorista',
            feedback: 'Opinión',
            sampler: 'Muestras',
          }
        : {
            support: 'General support',
            wholesale: 'Wholesale enquiry',
            feedback: 'Feedback',
            sampler: 'Sampler',
          };
      const body = [
        `${spanish ? 'Consulta' : 'Inquiry'}: ${input.inquiryId}`,
        `${spanish ? 'Tema' : 'Topic'}: ${categories[input.category]}`,
        `${spanish ? 'Nombre' : 'Name'}: ${input.name}`,
        `${spanish ? 'Correo' : 'Email'}: ${input.email}`,
        '',
        input.message,
        ...(input.category === 'sampler'
          ? [
              '',
              spanish ? 'Selección de seis piezas:' : 'Six-piece selection:',
              ...selection.map(
                (item) => `${item.quantity} × ${item.name[input.locale]} (${item.productId})`,
              ),
              spanish
                ? 'Consulta recibida; no es un pedido ni confirma precio o entrega.'
                : 'Enquiry received; this is not an order or a price or delivery confirmation.',
            ]
          : []),
      ].join('\n');
      return send(
        input.email,
        spanish ? 'SolCacao: nueva consulta' : 'SolCacao: new enquiry',
        body,
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
