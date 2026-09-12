import { z } from 'zod';
export const localeSchema = z.enum(['en', 'es']);
export const idSchema = z.string().regex(/^[a-f0-9]{24}$/i);
export const cartLineSchema = z
  .object({ productId: idSchema, quantity: z.number().int().min(1).max(99) })
  .strict();
export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    password: z
      .string()
      .min(12)
      .max(72)
      .refine((v) => new TextEncoder().encode(v).length <= 72, 'Maximum 72 UTF-8 bytes'),
    role: z.enum(['retail', 'b2b']),
    companyName: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((v) => v.role !== 'b2b' || !!v.companyName, {
    path: ['companyName'],
    message: 'Company required for business accounts',
  });
export const quoteSchema = z
  .object({
    cacaoProfile: z.enum(['dark70', 'dark85', 'milk45']),
    quantity: z.number().int().min(50).max(100000),
    packaging: z.enum(['sleeve', 'giftBox', 'bulk']),
    companyName: z.string().trim().min(1).max(120),
    contactEmail: z.string().email().max(254),
    notes: z.string().max(2000).optional(),
    locale: localeSchema,
    requestId: z.string().uuid(),
  })
  .strict();
export const inquirySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email().max(254),
    category: z.enum(['support', 'wholesale', 'feedback', 'sampler']),
    message: z.string().trim().min(10).max(2000),
    locale: localeSchema,
    requestId: z.string().uuid(),
    samplerItems: z.array(cartLineSchema).max(6).optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      v.category === 'sampler' &&
      (!v.samplerItems || v.samplerItems.reduce((n, x) => n + x.quantity, 0) !== 6)
    )
      c.addIssue({ code: 'custom', path: ['samplerItems'], message: 'Select exactly six pieces' });
    if (v.category !== 'sampler' && v.samplerItems)
      c.addIssue({
        code: 'custom',
        path: ['samplerItems'],
        message: 'Only sampler inquiries may include pieces',
      });
  });
