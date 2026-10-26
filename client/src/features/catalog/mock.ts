import type {
  Cart,
  CartLine,
  CatalogApi,
  HttpClient,
  OrderReceipt,
  Product,
} from '../../../../contracts/index.js';
import { idSchema } from '../../../../contracts/validation.js';
import { ApiError } from '../../api/http.js';
import { sessionToken } from '../../api/session.js';
import { makeCatalogFixtures } from './fixtures.js';
import {
  MERGE_MARKER_LIMIT,
  canonicalCheckout,
  cartLinesSchema,
  compareProducts,
  fieldErrorsOf,
  isSlug,
  matchesQuery,
  mergeCartSchema,
  mergeLines,
  parseCheckout,
  parseProductQuery,
  totalPagesOf,
} from './rules.js';

export interface MockCatalogOptions {
  /** Fixture products. Defaults to the fictional catalog fixtures. */
  products?: Product[];
  /**
   * Current session token, read at call time. Defaults to the shared sessionToken store that
   * Student 1's AuthProvider fills with `mock:<userId>` (docs/contracts.md, mock identity boundary).
   */
  token?: () => string | null;
  now?: () => Date;
  /** Simulated latency so loading states are visible in the demo. */
  delayMs?: number;
}

const wait = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
const copy = <T>(value: T): T => structuredClone(value);
const invalid = (fieldErrors: Record<string, string>) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);
const unauthorized = () => new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

/** User id inside a `mock:<24-hex>` token; anything else is not a verifiable session. */
function mockUserId(token: string): string | null {
  const id = token.startsWith('mock:') ? token.slice(5) : '';
  return idSchema.safeParse(id).success ? id.toLowerCase() : null;
}

/** Deterministic 24-hex id from a UUID, like the B2B mock's receipts. */
const idFromUuid = (uuid: string) => uuid.replace(/-/g, '').slice(0, 24).toLowerCase();

interface SavedCart {
  items: CartLine[];
  revision: number;
  mergeIds: string[];
}

/**
 * Phase 2 mock of every CatalogApi method, with the server's semantics and error envelope
 * (shared through rules.ts): exact query filtering/sorting/pagination, saved carts keyed by the
 * mock user id with revision conflicts and idempotent merges, and simulated checkout with
 * requestId idempotency. State lives in this tab's memory only; nothing is claimed saved to a
 * database and no stock is deducted.
 */
export function createMockCatalog(_http: HttpClient, options: MockCatalogOptions = {}): CatalogApi {
  const {
    products = makeCatalogFixtures(),
    token = sessionToken.get,
    now = () => new Date(),
    delayMs = 250,
  } = options;
  const carts = new Map<string, SavedCart>();
  const orders = new Map<string, { hash: string; userId: string | null; receipt: OrderReceipt }>();

  const activeById = (id: string) =>
    products.find((product) => product.id === id.toLowerCase() && product.active);

  function requireUser(): string {
    const current = token();
    const id = current ? mockUserId(current) : null;
    if (!id) throw unauthorized();
    return id;
  }

  function optionalUser(): string | null {
    const current = token();
    if (current === null || current === '') return null;
    const id = mockUserId(current);
    if (!id) throw unauthorized(); // An invalid supplied token is never downgraded to a guest.
    return id;
  }

  const savedCart = (userId: string): SavedCart =>
    carts.get(userId) ?? { items: [], revision: 0, mergeIds: [] };
  const toCart = (cart: SavedCart): Cart => ({ items: copy(cart.items), revision: cart.revision });

  function assertPurchasable(items: CartLine[]) {
    const unavailable: Record<string, string> = {};
    const short: Record<string, string> = {};
    items.forEach((line, index) => {
      const product = activeById(line.productId);
      if (!product) unavailable[`items.${index}.productId`] = 'Product unavailable';
      else if (line.quantity > product.stock)
        short[`items.${index}.quantity`] = `Only ${product.stock} available`;
    });
    return { unavailable, short };
  }

  return {
    async list(query) {
      await wait(delayMs);
      const parsed = parseProductQuery(query);
      if (!parsed.ok) throw invalid(parsed.fieldErrors);
      const q = parsed.value;
      const matching = products
        .filter((product) => matchesQuery(product, q))
        .sort(compareProducts(q.sort, q.locale));
      const start = (q.page - 1) * q.limit;
      return {
        items: copy(matching.slice(start, start + q.limit)),
        page: q.page,
        limit: q.limit,
        total: matching.length,
        totalPages: totalPagesOf(matching.length, q.limit),
      };
    },

    async get(slug) {
      await wait(delayMs);
      const product = isSlug(slug)
        ? products.find((item) => item.slug === slug && item.active)
        : undefined;
      if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
      return copy(product);
    },

    async cart() {
      await wait(delayMs);
      return toCart(savedCart(requireUser()));
    },

    async persist({ items, expectedRevision }) {
      await wait(delayMs);
      const userId = requireUser();
      if (!Number.isInteger(expectedRevision) || expectedRevision < 0)
        throw invalid({ 'If-Match': 'Send the expected cart revision as a quoted integer' });
      const lines = cartLinesSchema.safeParse(items);
      if (!lines.success)
        throw invalid(
          Object.fromEntries(
            Object.entries(fieldErrorsOf(lines.error)).map(([key, message]) => [
              key === 'request' ? 'items' : `items.${key}`,
              message,
            ]),
          ),
        );
      const { unavailable, short } = assertPurchasable(lines.data);
      if (Object.keys(unavailable).length) throw invalid(unavailable);
      if (Object.keys(short).length)
        throw new ApiError(409, 'OUT_OF_STOCK', 'Not enough stock for some items', short);
      const current = savedCart(userId);
      if (current.revision !== expectedRevision)
        throw new ApiError(409, 'CART_CONFLICT', 'The cart changed. Reload it and try again.');
      const next = { ...current, items: copy(lines.data), revision: current.revision + 1 };
      carts.set(userId, next);
      return toCart(next);
    },

    async merge(input) {
      await wait(delayMs);
      const userId = requireUser();
      const parsed = mergeCartSchema.safeParse(input);
      if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
      const current = savedCart(userId);
      if (current.mergeIds.includes(parsed.data.mergeId)) return toCart(current);
      const { items } = mergeLines(
        current.items,
        parsed.data.items.map((line) => ({ ...line, productId: line.productId.toLowerCase() })),
        (id) => activeById(id)?.stock,
      );
      const next: SavedCart = {
        items,
        revision: current.revision + 1,
        mergeIds: [...current.mergeIds, parsed.data.mergeId].slice(-MERGE_MARKER_LIMIT),
      };
      carts.set(userId, next);
      return toCart(next);
    },

    async checkout(input) {
      await wait(delayMs);
      const userId = optionalUser();
      const parsed = parseCheckout(input);
      if (!parsed.ok) throw invalid(parsed.fieldErrors);
      const request = parsed.value;
      const hash = canonicalCheckout(request);
      const existing = orders.get(request.requestId);
      if (existing) {
        if (existing.hash !== hash || existing.userId !== userId)
          throw new ApiError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'requestId was already used for a different request',
          );
        return { ...existing.receipt };
      }
      const { unavailable, short } = assertPurchasable(request.items);
      const problems = { ...unavailable, ...short };
      if (Object.keys(problems).length)
        throw new ApiError(409, 'OUT_OF_STOCK', 'Some items are not available', problems);
      const totalCents = request.items.reduce(
        (sum, line) => sum + activeById(line.productId)!.priceCents * line.quantity,
        0,
      );
      const receipt: OrderReceipt = {
        id: idFromUuid(request.requestId),
        status: 'simulated',
        totalCents,
        currency: 'USD',
        createdAt: now().toISOString(),
      };
      orders.set(request.requestId, { hash, userId, receipt });
      return { ...receipt };
    },
  };
}
