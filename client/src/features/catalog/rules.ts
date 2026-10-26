import { z } from 'zod';
import type { CartLine, Locale, Product, ProductQuery } from '../../../../contracts/index.js';
import { cartLineSchema, idSchema, localeSchema } from '../../../../contracts/validation.js';

/**
 * Catalog, cart and checkout rules from docs/contracts.md, shared by the Phase 2 mock adapter and
 * the Express routes (server/src/features/catalog imports this file, as the shell router does with
 * its dictionaries). Pure TypeScript: no browser, React or database imports.
 */

export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 48;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_QUANTITY = 99;
export const MAX_CART_LINES = 50;
/** Retry horizon for repeated guest merges: the latest 100 mergeIds are kept per cart. */
export const MERGE_MARKER_LIMIT = 100;
export const CATEGORIES = ['bar', 'truffle', 'seasonal'] as const;
export const SORTS = ['name', 'priceAsc', 'priceDesc'] as const;
export const QUERY_KEYS = [
  'search',
  'origin',
  'cacaoPct',
  'cacaoMin',
  'cacaoMax',
  'priceMinCents',
  'priceMaxCents',
  'category',
  'page',
  'limit',
  'sort',
  'locale',
] as const;
const NUMERIC_KEYS = new Set<string>([
  'cacaoPct',
  'cacaoMin',
  'cacaoMax',
  'priceMinCents',
  'priceMaxCents',
  'page',
  'limit',
]);

export type FieldErrors = Record<string, string>;
export type Parsed<T> = { ok: true; value: T } | { ok: false; fieldErrors: FieldErrors };

/** Flat field -> first message map for the error envelope (e.g. "items.0.quantity"). */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      const prefix = issue.path.length ? `${issue.path.join('.')}.` : '';
      for (const key of issue.keys) fieldErrors[`${prefix}${key}`] = 'Unexpected field';
      continue;
    }
    const field = issue.path.length ? issue.path.join('.') : 'request';
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

const percent = z.number().int().min(0).max(100);
const cents = z.number().int().min(0).max(100_000_000);

/** Typed ProductQuery as the UI and mock receive it. Strict: unknown keys are rejected. */
export const productQuerySchema = z
  .object({
    search: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
    origin: z.string().trim().min(1).max(100).optional(),
    cacaoPct: percent.optional(),
    cacaoMin: percent.optional(),
    cacaoMax: percent.optional(),
    priceMinCents: cents.optional(),
    priceMaxCents: cents.optional(),
    category: z.enum(CATEGORIES).optional(),
    page: z.number().int().min(1).max(100_000).optional(),
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    sort: z.enum(SORTS).optional(),
    locale: localeSchema.optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (
      query.cacaoPct !== undefined &&
      (query.cacaoMin !== undefined || query.cacaoMax !== undefined)
    )
      context.addIssue({
        code: 'custom',
        path: ['cacaoPct'],
        message: 'Use cacaoPct or cacaoMin/cacaoMax, not both',
      });
    if (
      query.cacaoMin !== undefined &&
      query.cacaoMax !== undefined &&
      query.cacaoMin > query.cacaoMax
    )
      context.addIssue({ code: 'custom', path: ['cacaoMin'], message: 'Must be at most cacaoMax' });
    if (
      query.priceMinCents !== undefined &&
      query.priceMaxCents !== undefined &&
      query.priceMinCents > query.priceMaxCents
    )
      context.addIssue({
        code: 'custom',
        path: ['priceMinCents'],
        message: 'Must be at most priceMaxCents',
      });
  });

/** Query with defaults applied and an empty search removed. Both adapters filter with this. */
export interface NormalizedQuery {
  search?: string;
  origin?: string;
  cacaoPct?: number;
  cacaoMin?: number;
  cacaoMax?: number;
  priceMinCents?: number;
  priceMaxCents?: number;
  category?: Product['category'];
  page: number;
  limit: number;
  sort: (typeof SORTS)[number];
  locale: Locale;
}

function withDefaults(query: z.output<typeof productQuerySchema>): NormalizedQuery {
  const { search, ...rest } = query;
  return {
    ...rest,
    ...(search ? { search } : {}),
    page: query.page ?? 1,
    limit: query.limit ?? DEFAULT_LIMIT,
    sort: query.sort ?? 'name',
    locale: query.locale ?? 'en',
  };
}

/** Validates a typed ProductQuery (mock adapter). Undefined values are treated as absent. */
export function parseProductQuery(query: ProductQuery): Parsed<NormalizedQuery> {
  const present = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  );
  const parsed = productQuerySchema.safeParse(present);
  return parsed.success
    ? { ok: true, value: withDefaults(parsed.data) }
    : { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
}

/**
 * Parses URL query primitives explicitly (server). Each key must appear at most once as a plain
 * string; numbers must be plain base-10 integers. Bracketed keys such as `origin[$ne]` are unknown
 * keys and rejected, so no raw query object can reach a database filter.
 */
export function parseProductSearchParams(
  raw: Record<string, unknown> | URLSearchParams,
): Parsed<NormalizedQuery> {
  const entries: [string, unknown][] =
    raw instanceof URLSearchParams
      ? [...new Set(raw.keys())].map((key) => {
          const all = raw.getAll(key);
          return [key, all.length === 1 ? all[0] : all];
        })
      : Object.entries(raw);
  const fieldErrors: FieldErrors = {};
  const typed: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (!(QUERY_KEYS as readonly string[]).includes(key)) {
      fieldErrors[key] = 'Unexpected field';
      continue;
    }
    if (typeof value !== 'string') {
      fieldErrors[key] = 'Send a single value';
      continue;
    }
    if (NUMERIC_KEYS.has(key)) {
      if (!/^\d{1,9}$/.test(value)) fieldErrors[key] = 'Must be a whole number';
      else typed[key] = Number(value);
    } else typed[key] = value;
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  const parsed = productQuerySchema.safeParse(typed);
  return parsed.success
    ? { ok: true, value: withDefaults(parsed.data) }
    : { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
}

/** Same predicate the server expresses as a Mongo filter. Inactive products never match. */
export function matchesQuery(product: Product, query: NormalizedQuery): boolean {
  if (!product.active) return false;
  if (query.category && product.category !== query.category) return false;
  if (query.origin && product.origin !== query.origin) return false;
  if (query.cacaoPct !== undefined && product.cacaoPct !== query.cacaoPct) return false;
  if (query.cacaoMin !== undefined && product.cacaoPct < query.cacaoMin) return false;
  if (query.cacaoMax !== undefined && product.cacaoPct > query.cacaoMax) return false;
  if (query.priceMinCents !== undefined && product.priceCents < query.priceMinCents) return false;
  if (query.priceMaxCents !== undefined && product.priceCents > query.priceMaxCents) return false;
  if (query.search) {
    const needle = query.search.toLocaleLowerCase(query.locale);
    const haystacks = [product.name[query.locale], product.description[query.locale]];
    if (!haystacks.some((text) => text.toLocaleLowerCase(query.locale).includes(needle)))
      return false;
  }
  return true;
}

/** Localized name or price order, always with id as the tie-breaker. */
export function compareProducts(sort: NormalizedQuery['sort'], locale: Locale) {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  return (a: Product, b: Product) => {
    const primary =
      sort === 'priceAsc'
        ? a.priceCents - b.priceCents
        : sort === 'priceDesc'
          ? b.priceCents - a.priceCents
          : collator.compare(a.name[locale], b.name[locale]);
    return primary || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  };
}

/** Escapes regex metacharacters so search is always a literal substring. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const totalPagesOf = (total: number, limit: number) =>
  total ? Math.ceil(total / limit) : 0;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isSlug = (value: string) => value.length <= 120 && SLUG_PATTERN.test(value);

/** Persisted cart lines: at most 50 distinct products, quantity 1–99, no duplicate IDs. */
export const cartLinesSchema = z
  .array(cartLineSchema)
  .max(MAX_CART_LINES)
  .superRefine((lines, context) => {
    const seen = new Set<string>();
    lines.forEach((line, index) => {
      const id = line.productId.toLowerCase();
      if (seen.has(id))
        context.addIssue({
          code: 'custom',
          path: [index, 'productId'],
          message: 'Duplicate product',
        });
      seen.add(id);
    });
  });

export const mergeCartSchema = z
  .object({ items: cartLinesSchema, mergeId: z.string().uuid() })
  .strict();

/** Reserved or non-country region codes that Intl may still name. */
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'QO', 'UN', 'ZZ', 'XA', 'XB', 'AA', 'QM', 'QN', 'XK']);
const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });

/** ISO 3166-1 alpha-2 country code check, using the runtime's ICU region data. */
export function isCountryCode(value: string): boolean {
  if (!/^[A-Z]{2}$/.test(value) || NOT_COUNTRIES.has(value)) return false;
  const name = regionNames.of(value);
  return Boolean(name && name !== value);
}

let countryCodes: string[] | undefined;
/** All alpha-2 codes the runtime can name, for the checkout country picker. */
export function listCountryCodes(): string[] {
  if (!countryCodes) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    countryCodes = [];
    for (const a of letters)
      for (const b of letters) if (isCountryCode(a + b)) countryCodes.push(a + b);
  }
  return countryCodes;
}

const text = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, `Maximum ${max} characters`);

/** Checkout address: line2 optional, `id` rejected (strict), international postal strings allowed. */
export const checkoutAddressSchema = z
  .object({
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

export const checkoutSchema = z
  .object({
    items: cartLinesSchema.min(1, 'Cart is empty'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Maximum 254 characters')
      .email('Invalid email'),
    address: checkoutAddressSchema,
    requestId: z.string().uuid(),
  })
  .strict();

export type NormalizedCheckout = z.output<typeof checkoutSchema>;

export function parseCheckout(input: unknown): Parsed<NormalizedCheckout> {
  const parsed = checkoutSchema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
}

/** Key-sorted JSON of the normalized request, hashed by both adapters for idempotency. */
export function canonicalCheckout(input: NormalizedCheckout): string {
  const sortKeys = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sortKeys)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, inner]) => inner !== undefined)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, inner]) => [key, sortKeys(inner)]),
          )
        : value;
  return JSON.stringify(
    sortKeys({
      ...input,
      items: input.items.map((line) => ({ ...line, productId: line.productId.toLowerCase() })),
    }),
  );
}

export interface MergeResult {
  items: CartLine[];
}

/**
 * Additive guest -> saved merge (docs/contracts.md): matching products are summed and capped at
 * min(99, available stock); guest lines for unavailable or zero-stock products are dropped; saved
 * lines that the guest did not touch stay as they are. The result never exceeds 50 lines.
 * `stockOf` returns undefined for a missing or inactive product.
 */
export function mergeLines(
  saved: CartLine[],
  guest: CartLine[],
  stockOf: (productId: string) => number | undefined,
): MergeResult {
  const items = saved.map((line) => ({ ...line }));
  for (const line of guest) {
    const stock = stockOf(line.productId);
    const existing = items.find((item) => item.productId === line.productId);
    if (!stock || stock <= 0) {
      if (existing) items.splice(items.indexOf(existing), 1);
      continue;
    }
    const cap = Math.min(MAX_QUANTITY, stock);
    if (existing) existing.quantity = Math.min(cap, existing.quantity + line.quantity);
    else if (items.length < MAX_CART_LINES)
      items.push({ productId: line.productId, quantity: Math.min(cap, line.quantity) });
  }
  return { items };
}

export const isId = (value: string) => idSchema.safeParse(value).success;
