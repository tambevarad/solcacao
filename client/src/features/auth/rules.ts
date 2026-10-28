import { z } from 'zod';
import type { Locale } from '../../../../contracts/index.js';
import { idSchema, registerSchema } from '../../../../contracts/validation.js';

/**
 * Auth validation shared by the forms, the mock adapter and the Express routes, so all three
 * accept and reject the same input. registerSchema itself is the contract one; the schemas below
 * cover the auth endpoints contracts/validation.ts does not yet (see team/member-1/handoff.md).
 */
export { registerSchema };

export const MAX_ADDRESSES = 20;

export type FieldErrors = Record<string, string>;

/** Flat field -> first message map for the error envelope; unknown keys become field errors. */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) fieldErrors[key] = 'Unexpected field';
      continue;
    }
    const field = issue.path.length ? issue.path.join('.') : 'request';
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

/** Trim + lowercase: the one spelling used for uniqueness and lookup. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Login only checks shape: password rules are not revealed or enforced here, so an account
// created under older limits can still sign in, and failures stay generic.
export const loginSchema = z
  .object({
    email: z.string().trim().min(1, 'Required').max(254).email(),
    password: z.string().min(1, 'Required').max(1024),
  })
  .strict();

const text = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, `Maximum ${max} characters`);

/** PATCH /users/me. Strict: role, email, passwordHash or userId in the body are rejected. */
export const profileSchema = z
  .object({ name: text(100), companyName: text(120).optional() })
  .strict();

const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
// Codes ICU can name that are not ISO countries; same list as the checkout address check.
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'QO', 'UN', 'ZZ', 'XA', 'XB', 'AA', 'QM', 'QN', 'XK']);

/** ISO 3166-1 alpha-2 country code check, using the runtime's ICU region data. */
export function isCountryCode(value: string): boolean {
  if (!/^[A-Z]{2}$/.test(value) || NOT_COUNTRIES.has(value)) return false;
  const name = regionNames.of(value);
  return Boolean(name && name !== value);
}

let countryCodes: string[] | undefined;
/** All alpha-2 codes the runtime can name, for the address country picker. */
export function listCountryCodes(): string[] {
  if (!countryCodes) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    countryCodes = [];
    for (const a of letters)
      for (const b of letters) if (isCountryCode(a + b)) countryCodes.push(a + b);
  }
  return countryCodes;
}

/**
 * POST /users/me/addresses. `id` is optional (absent = create). Strict, so userId can never be
 * supplied; ownership always comes from the verified session.
 */
export const addressSchema = z
  .object({
    id: idSchema.optional(),
    recipient: text(100),
    line1: text(200),
    line2: z
      .string()
      .trim()
      .max(200, 'Maximum 200 characters')
      .optional()
      .transform((value) => value || undefined),
    city: text(100),
    region: text(100),
    postalCode: z
      .string()
      .trim()
      .min(1, 'Required')
      .max(20, 'Maximum 20 characters')
      .regex(/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u, 'Invalid postal code'),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .refine(isCountryCode, 'Use a two-letter ISO country code'),
  })
  .strict();

const RETURN_TO = /^\/(en|es)(?=[/?#]|$)/;

/**
 * Internal destination after sign-in, or null. Only a same-origin relative path under /en or /es
 * is accepted; protocol-relative (//), backslash, encoded-slash and control-character tricks are
 * rejected. The locale prefix is rewritten to the current one so a language switch on the login
 * page carries through.
 */
export function safeReturnTo(value: unknown, locale: Locale): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  if (!RETURN_TO.test(value)) return null;
  if (/\/\/|\\|%2f|%5c|[\u0000-\u001f\u007f]/i.test(value)) return null;
  return value.replace(RETURN_TO, `/${locale}`);
}
