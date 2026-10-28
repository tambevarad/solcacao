import { inquirySchema } from '../../../../contracts/validation.js';
import type { InquiryInput } from '../../../../contracts/index.js';

export const supportInquirySchema = inquirySchema.superRefine((input, context) => {
  const ids = input.samplerItems?.map((item) => item.productId.toLowerCase()) ?? [];
  if (new Set(ids).size !== ids.length)
    context.addIssue({ code: 'custom', path: ['samplerItems'], message: 'Duplicate product IDs' });
  if (/[\r\n]/.test(input.email))
    context.addIssue({ code: 'custom', path: ['email'], message: 'Invalid email' });
});

export function normalizeInquiry(input: InquiryInput): InquiryInput {
  return {
    name: input.name.trim(),
    email: input.email.toLowerCase(),
    category: input.category,
    message: input.message.trim(),
    locale: input.locale,
    requestId: input.requestId,
    ...(input.samplerItems
      ? {
          samplerItems: input.samplerItems
            .map((item) => ({
              productId: item.productId.toLowerCase(),
              quantity: item.quantity,
            }))
            .sort((a, b) => a.productId.localeCompare(b.productId)),
        }
      : {}),
  };
}

export function canonicalInquiry(input: InquiryInput): string {
  const { requestId: _requestId, ...body } = normalizeInquiry(input);
  return JSON.stringify(body);
}

export function whatsappUrl(number: string | undefined, message: string): string | null {
  return number && /^[1-9]\d{6,14}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}
